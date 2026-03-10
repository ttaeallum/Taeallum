/**
 * /api/ai — Taallm Intelligent Agent API
 *
 * Endpoints:
 *   POST   /api/ai/chat              → Main agent conversation (onboarding + active learning)
 *   GET    /api/ai/session           → Load session state + message history
 *   POST   /api/ai/reset             → Reset session (start over)
 *   GET    /api/ai/plan/current      → Get current active study plan
 *   POST   /api/ai/plan/rebuild      → Rebuild plan when student changes goal
 *   POST   /api/ai/quiz/generate     → Generate quiz for a completed course
 *   POST   /api/ai/quiz/submit       → Submit quiz answers and get result
 *   POST   /api/ai/progress/complete → Mark a course as complete
 *   GET    /api/ai/progress/dashboard→ Full progress snapshot
 *   POST   /api/ai/inactivity/sweep  → Admin: trigger inactivity check for all users
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "./auth";
import { chat, resetSession, getSession } from "../services/ai.service";
import { generateQuiz, evaluateQuiz, advancePlanAfterPass } from "../services/quiz.engine";
import {
  markCourseComplete,
  checkInactivity,
  runInactivitySweep,
  handleGoalChange,
  updatePerformanceProfile,
  getDashboard,
} from "../services/progress.tracker";
import { askCourseQuestion } from "../services/course-qa.service";
import { db } from "../db";
import { studyPlans } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { chatRateLimit, quizRateLimit, aiQueueMiddleware } from "../middleware/ai-limits";

const router = Router();

// ─── 1. Main chat ─────────────────────────────────────────────────────────────

router.post("/chat", requireAuth, chatRateLimit, aiQueueMiddleware, chat);

// ─── 2. Session ───────────────────────────────────────────────────────────────

router.get("/session", requireAuth, getSession);

router.post("/reset", requireAuth, resetSession);

// ─── 3. Study Plan ───────────────────────────────────────────────────────────

/**
 * GET /api/ai/plan/current
 * Returns the student's latest active study plan with full milestone details.
 */
router.get("/plan/current", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;

    const [plan] = await db
      .select()
      .from(studyPlans)
      .where(and(eq(studyPlans.userId, userId), eq(studyPlans.status, "active")))
      .orderBy(desc(studyPlans.createdAt))
      .limit(1);

    if (!plan) {
      return res.status(404).json({
        message: "لا توجد خطة دراسية نشطة. ابدأ محادثة مع المرشد الذكي لبناء خطتك.",
        hasPlan: false,
      });
    }

    res.json({ hasPlan: true, plan });
  } catch (err: any) {
    console.error("[AI ROUTES] plan/current error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/ai/plan/rebuild
 * Rebuilds plan from current completion point when student changes goal.
 * Body: { newGoal: string }
 */
router.post("/plan/rebuild", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const { newGoal } = req.body;

    if (!newGoal || typeof newGoal !== "string") {
      return res.status(400).json({ message: "newGoal is required" });
    }

    // Get current session
    const { getOrCreateSession } = await import("../services/agent.orchestrator");
    const session = await getOrCreateSession(userId);
    const currentProfile = (session.userProfile as any) || {};

    const result = await handleGoalChange(userId, session.id, newGoal, currentProfile);

    res.json({
      success: true,
      message: result.message,
      planId: result.planId,
      plan: result.plan,
    });
  } catch (err: any) {
    console.error("[AI ROUTES] plan/rebuild error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ─── 4. Quiz ─────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/quiz/generate
 * Generates a 5-question quiz for a course.
 * Body: { courseId: string }
 */
router.post("/quiz/generate", requireAuth, quizRateLimit, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: "courseId is required" });

    const quiz = await generateQuiz(courseId);
    // Strip correct answers before sending to client
    const safeQuestions = quiz.questions.map(({ correctIndex: _, explanation: __, ...q }) => q);

    res.json({
      quizId: quiz.quizId,
      courseId: quiz.courseId,
      courseTitle: quiz.courseTitle,
      questions: safeQuestions,
      difficulty: quiz.difficulty,
      totalQuestions: quiz.questions.length,
    });
  } catch (err: any) {
    console.error("[AI ROUTES] quiz/generate error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/ai/quiz/submit
 * Evaluates submitted quiz answers.
 * Body: { quizId, courseId, answers: number[], questions: QuizQuestion[] }
 *
 * Returns: { score, passed, feedback, weakTopics, nextAction, nextCourse? }
 */
router.post("/quiz/submit", requireAuth, quizRateLimit, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const { quizId, courseId, answers, questions } = req.body;

    if (!quizId || !courseId || !Array.isArray(answers) || !Array.isArray(questions)) {
      return res.status(400).json({ message: "quizId, courseId, answers[], questions[] required" });
    }

    // Evaluate
    const result = await evaluateQuiz(userId, quizId, courseId, answers, questions);

    // Update performance profile
    const passedTopics = questions
      .filter((_: any, i: number) => answers[i] === questions[i].correctIndex)
      .map((q: any) => q.topic);
    const failedTopics = result.weakTopics;
    await updatePerformanceProfile(userId, passedTopics, failedTopics);

    let nextCourse = null;
    if (result.passed) {
      // Advance plan
      const advance = await advancePlanAfterPass(userId, courseId);
      nextCourse = advance.nextCourseId
        ? { id: advance.nextCourseId, title: advance.nextCourseTitle }
        : null;

      if (advance.planComplete) {
        return res.json({
          ...result,
          nextCourse: null,
          planComplete: true,
          celebrationMessage: "🎉 مبروك! لقد أكملت خطتك الدراسية كاملة! أنت الآن جاهز للعمل في مجالك.",
        });
      }
    }

    res.json({ ...result, nextCourse });
  } catch (err: any) {
    console.error("[AI ROUTES] quiz/submit error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ─── 5. Progress ─────────────────────────────────────────────────────────────

/**
 * POST /api/ai/progress/complete
 * Marks a course as complete and auto-triggers quiz.
 * Body: { courseId: string }
 */
router.post("/progress/complete", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const { courseId } = req.body;

    if (!courseId) return res.status(400).json({ message: "courseId is required" });

    const result = await markCourseComplete(userId, courseId);

    // Auto-generate quiz for the just-completed course
    let quiz = null;
    try {
      quiz = await generateQuiz(courseId);
      const safeQuestions = quiz.questions.map(({ correctIndex: _, explanation: __, ...q }) => q);
      quiz = { ...quiz, questions: safeQuestions };
    } catch (quizErr) {
      console.warn("[AI ROUTES] Quiz generation failed (non-fatal):", quizErr);
    }

    res.json({
      ...result,
      quiz,
      message: quiz
        ? "أحسنت! 🎉 تم تسجيل إتمام الكورس. الآن خذ هذا الاختبار القصير للتحقق من فهمك."
        : "تم تسجيل إتمام الكورس.",
    });
  } catch (err: any) {
    console.error("[AI ROUTES] progress/complete error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/ai/progress/dashboard
 * Full progress snapshot for the student.
 */
router.get("/progress/dashboard", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const dashboard = await getDashboard(userId);

    if (!dashboard) {
      return res.status(404).json({
        message: "لا توجد خطة دراسية. ابدأ محادثة مع المرشد الذكي.",
        hasPlan: false,
      });
    }

    // Also check inactivity (non-blocking)
    checkInactivity(userId).catch(e =>
      console.warn("[AI ROUTES] Inactivity check non-fatal:", e)
    );

    res.json({ hasPlan: true, dashboard });
  } catch (err: any) {
    console.error("[AI ROUTES] progress/dashboard error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ─── 6. Admin: inactivity sweep ──────────────────────────────────────────────

/**
 * POST /api/ai/inactivity/sweep
 * Admin endpoint: checks all users with active plans for 7+ day inactivity.
 * Sends reminder emails to inactive students.
 */
router.post("/inactivity/sweep", async (req: Request, res: Response) => {
  // Lightweight admin auth check
  if (!req.session.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const result = await runInactivitySweep();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/ai/course-qa
 * Course-specific RAG Q&A
 * Body: { question: string, courseId: string, lessonId?: string }
 */
router.post("/course-qa", requireAuth, async (req: Request, res: Response) => {
  try {
    const { question, courseId, lessonId } = req.body;
    if (!question || !courseId) {
      return res.status(400).json({ message: "question and courseId are required" });
    }

    const response = await askCourseQuestion({ question, courseId, lessonId });
    res.json(response);
  } catch (err: any) {
    console.error("[AI ROUTES] course-qa error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
