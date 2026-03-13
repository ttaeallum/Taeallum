/** Platform Version: 1.1.4-stable (Resilient Sync) **/
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import path from "path";
import fs from "fs";
import cors from "cors";
import compression from "compression";

import adminAuthRouter from "./routes/admin-auth";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import publicCoursesRouter from "./routes/public-courses";
import accessRouter from "./routes/access";
import webhooksRouter from "./routes/webhooks";
import paymentsRouter from "./routes/payments";
import courseContentRouter from "./routes/course-content";
import bunnyRouter from "./routes/bunny";
import chatbotRouter from "./routes/chatbot";
import aiEngineRouter from "./routes/ai-engine";
import adsRouter from "./routes/ads";
import payTabsRouter from "./routes/paytabs";
import youtubeRouter from "./routes/youtube";
import promoCodesRouter from "./routes/promo-codes";
import seoRouter from "./routes/seo";
import aiAnalysisRouter from "./routes/ai-analysis";
import aiRouter from "./routes/ai";
import agentRouter from "./routes/agent";

import { db } from "./db";
import { sql } from "drizzle-orm";
import { serveStatic } from "./static";
import { registerRoutes } from "./routes";

import connectPg from "connect-pg-simple";
import { pool } from "./db";

const app = express();
const httpServer = createServer(app);

// 1. Core Midlleware & Security
app.use(cors({
  origin: true, // Echoes the origin from the request, standard for credentials: true
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(compression());
app.use(express.json({
  verify: (req: any, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhooks')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

// --- Session Configuration ---
const PgSession = connectPg(session);
const sessionStore = new PgSession({
  pool,
  createTableIfMissing: true,
  errorLog: (err: any) => console.error("[SESSION STORE ERROR]", err)
});

app.use(
  session({
    store: sessionStore,
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "hamza-platform-2026-secure",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-site prod, 'lax' for local
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    },
    proxy: true
  })
);

// --- 2. API MODULES ---
app.use("/api/auth", authRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin-panel", adminRouter);
app.use("/api/courses", publicCoursesRouter);
app.use("/api/access", accessRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/course-content", courseContentRouter);
app.use("/api/bunny", bunnyRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/ai-engine", aiEngineRouter);
app.use("/api/paytabs", payTabsRouter);
app.use("/api/youtube", youtubeRouter);
app.use("/api/ads", adsRouter);
app.use("/api/promo-codes", promoCodesRouter);
app.use("/api/ai-analysis", aiAnalysisRouter);
app.use("/api/ai", aiRouter);
app.use("/api/agent", agentRouter);
app.use("/", seoRouter);

// --- DEBUG Endpoint ---
app.get("/api/test-bunny", async (req, res) => {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=1`,
      { headers: { AccessKey: apiKey || "", Accept: "application/json" } }
    );
    res.json({ ok: response.ok, status: response.status, libId: libraryId ? "SET" : "MISSING" });
  } catch (e: any) {
    res.json({ ok: false, error: e.message });
  }
});

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/thumbnails", express.static(path.join(process.cwd(), "client", "public", "thumbnails")));
app.use(express.static(path.join(process.cwd(), "client", "public")));

// --- 3. STARTUP ---
(async () => {
  const PORT = Number(process.env.PORT) || 5000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running on port ${PORT}`);
  });

  try {
    // Basic DB Schema check
    await pool.query(`
        DO $$ 
        BEGIN 
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session') THEN
            IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid = 'session'::regclass AND contype = 'p') THEN
              ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");
            END IF;
          END IF;
        END $$;
      `);

    await pool.query(`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "bunny_video_id" TEXT;`);

    await registerRoutes(httpServer, app);

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite, serveViteSPA } = await import("./vite");
      const viteInstance = await setupVite(httpServer, app);
      serveViteSPA(viteInstance, app);
    }
  } catch (error) {
    console.error("[CRITICAL STARTUP ERROR]", error);
  }
})();

export default app;
