/**
 * AI endpoint middleware:
 * 1. Per-user rate limiting (sliding window, in-memory)
 * 2. Global concurrent AI request queue (max 20 simultaneous)
 */

import type { Request, Response, NextFunction } from "express";

// ─── Per-user rate limit ──────────────────────────────────────────────────────

interface RateWindow {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateWindow>();

function makeRateLimiter(maxPerMinute: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId: string = (req.session as any)?.userId || req.ip || "anon";
    const key = `${req.path}:${userId}`;
    const now = Date.now();
    const window = rateLimits.get(key);

    if (!window || now > window.resetAt) {
      rateLimits.set(key, { count: 1, resetAt: now + 60_000 });
      return next();
    }

    window.count++;
    if (window.count > maxPerMinute) {
      const retryAfter = Math.ceil((window.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "Too many requests",
        message: `الحد الأقصى ${maxPerMinute} طلبات/دقيقة. أعد المحاولة بعد ${retryAfter} ثانية.`,
        retryAfter,
      });
    }
    next();
  };
}

/** Rate limiter for /api/ai/chat — max 10 req/min per user */
export const chatRateLimit = makeRateLimiter(10);

/** Rate limiter for /api/ai/quiz routes — max 5 req/min per user */
export const quizRateLimit = makeRateLimiter(5);

// ─── Global AI concurrency queue ─────────────────────────────────────────────

const MAX_CONCURRENT = 20;
let activeAiRequests = 0;
const waitQueue: Array<() => void> = [];

function releaseSlot() {
  activeAiRequests--;
  const next = waitQueue.shift();
  if (next) {
    activeAiRequests++;
    next();
  }
}

/** Middleware that queues AI requests when > MAX_CONCURRENT are active */
export const aiQueueMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const estimatedWaitMs = Math.max(0, (waitQueue.length) * 3000); // ~3s per queued request

  if (activeAiRequests < MAX_CONCURRENT) {
    activeAiRequests++;
    res.on("finish", releaseSlot);
    res.on("close", releaseSlot);
    return next();
  }

  if (waitQueue.length >= 50) {
    return res.status(503).json({
      error: "Service overloaded",
      message: "الخادم مشغول حالياً. يرجى المحاولة بعد قليل.",
      retryAfter: 10,
    });
  }

  // Return estimated wait time header immediately, then queue
  res.setHeader("X-Queue-Position", String(waitQueue.length + 1));
  res.setHeader("X-Estimated-Wait-Ms", String(estimatedWaitMs));

  waitQueue.push(() => {
    res.on("finish", releaseSlot);
    res.on("close", releaseSlot);
    next();
  });
};

// Clean up stale rate-limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of rateLimits) {
    if (now > window.resetAt) rateLimits.delete(key);
  }
}, 300_000);
