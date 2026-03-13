/**
 * ai.service.ts — Unified AI Agent Dispatcher
 *
 * Single entry point for all AI interactions.
 * Routes each request through the correct service based on session state:
 *
 *   onboarding states → AgentOrchestrator (strict 5-step Q&A)
 *   plan_ready        → PlanBuilder (live DB courses, 3 layers)
 *   active_learning   → ProgressTracker (progress queries)
 *
 * This replaces the old single-function chat handler.
 */

import type { Request, Response } from "express";
import {
  getOrCreateSession,
  saveMessage,
  updateSession,
  type StudentProfile,
  type AgentState,
} from "./agent.orchestrator";
import { buildPlan, buildPlanFromAgentOutput } from "./plan.builder";
import { pathAgent } from "./path-agent.service";

// ─── Main chat handler (POST /api/ai/chat) ────────────────────────────────────

export const chat = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { message, messages, currentProfile } = req.body;
    // Support both { message: string } and { messages: [{role, content}] }
    const userMessage: string | undefined =
      typeof message === "string" && message
        ? message
        : Array.isArray(messages)
          ? messages.filter((m: any) => m.role === "user").at(-1)?.content
          : undefined;
    if (!userMessage || typeof userMessage !== "string") {
      return res.status(400).json({ error: "message (string) required" });
    }

    // 1. Load or create session
    const session = await getOrCreateSession(userId);
    const sessionId = session.id;
    const sessionState = (session.currentState as AgentState) || "ask_goal";
    const sessionProfile: StudentProfile = (session.userProfile as StudentProfile) || currentProfile || {};

    // 2. Save user message to history
    await saveMessage(sessionId, "user", userMessage);

    // 3. Route by state
    // States that are still in onboarding
    const ONBOARDING_STATES: AgentState[] = [
      "ask_goal", "ask_level", "ask_completed", "ask_hours", "confirm_profile"
    ];

    let responsePayload: any;

    if (ONBOARDING_STATES.includes(sessionState) || sessionState === "plan_ready") {
      // ── Onboarding: run Path Agent ──────────────────────────────────────
      const result = await pathAgent.process(userId, sessionId, userMessage);

      // Persist updated state and profile (if applicable)
      // Note: PathAgent is fluid, so we might stay in the same state or move to plan_ready
      const nextState: AgentState = result.action === "build_plan" ? "plan_ready" : sessionState;
      
      await updateSession(sessionId, nextState, sessionProfile);
      await saveMessage(sessionId, "assistant", result.message, {
        state: nextState,
        action: result.action,
        suggestions: result.suggestions
      });

      // If Path Agent says it's time to build the plan → do it now
      if (result.action === "build_plan" || nextState === "plan_ready") {
        try {
          const { plan, planId } = await buildPlanFromAgentOutput(result.learning_path, userId, sessionId);
          
          const finalMsg = "تم بناء خطتك بنجاح! 🎉";
          await saveMessage(sessionId, "assistant", finalMsg, {
            planId,
            action: "plan_built",
          });

          responsePayload = {
            message: `${result.message}\n\n🎉 خطتك الدراسية جاهزة!\n\n${plan.description}\n\n📅 المدة: ${plan.duration}\n⏱️ إجمالي الساعات: ${plan.totalHours} ساعة`,
            suggestions: ["ابدأ المستوى الأول الآن 🚀", "عرض تفاصيل الخطة 🎯"],
            action: "show_plan",
            state: "active_learning",
            study_plan: plan,
            planId,
          };
        } catch (planErr: any) {
          console.error("[AI SERVICE] Plan build failed:", planErr);
          responsePayload = {
            ...result,
            message: result.message + "\n\n⚠️ حدث خطأ أثناء بناء الخطة. يرجى المحاولة مرة أخرى.",
            action: "error",
          };
        }
      } else {
        responsePayload = {
          message: result.message,
          suggestions: result.suggestions,
          action: result.action,
          state: nextState
        };
      }

    } else {
      // ── Active learning: general Q&A about their plan ────────────────────
      responsePayload = {
        message: "أنت الآن في مرحلة التعلم الفعلية. استخدم لوحة التحكم لمتابعة تقدمك أو ابدأ كورسك التالي.",
        suggestions: ["عرض تقدمي", "ابدأ الاختبار", "غيّر هدفي"],
        action: "none",
        state: "active_learning",
      };
      await saveMessage(sessionId, "assistant", responsePayload.message);
    }

    res.json(responsePayload);

  } catch (err: any) {
    console.error("[AI SERVICE] Critical error:", err);
    res.status(500).json({
      error: "Something went wrong",
      message: "عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
      details: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
};

// ─── Reset session (POST /api/ai/reset) ──────────────────────────────────────

export const resetSession = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { db } = await import("../db");
    const { aiSessions } = await import("../db/schema");
    const { eq, and } = await import("drizzle-orm");

    await db
      .update(aiSessions)
      .set({ status: "completed", updatedAt: new Date() })
      .where(and(eq(aiSessions.userId, userId), eq(aiSessions.status, "active")));

    res.json({ success: true, message: "تم إعادة تعيين الجلسة. يمكنك البدء من جديد." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get session history (GET /api/ai/session) ────────────────────────────────

export const getSession = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const session = await getOrCreateSession(userId);

    const { db } = await import("../db");
    const { aiMessages } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");

    const messages = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.sessionId, session.id))
      .orderBy(aiMessages.createdAt);

    res.json({
      session: {
        id: session.id,
        state: session.currentState,
        profile: session.userProfile,
        generatedPlan: session.generatedPlan,
      },
      messages,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
