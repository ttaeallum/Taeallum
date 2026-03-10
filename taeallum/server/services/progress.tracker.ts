/**
 * ProgressTracker — monitors student activity and adapts the plan
 *
 * Responsibilities:
 *   1. markCourseComplete(userId, courseId)  — records completion, triggers quiz
 *   2. checkInactivity(userId)               — detects 7+ day gap, sends reminder
 *   3. runInactivitySweep()                  — bulk check for all active plans (cron-ready)
 *   4. handleGoalChange(userId, newGoal)     — rebuilds plan from current point
 *   5. getDashboard(userId)                  — returns full progress snapshot
 */

import { db } from "../db";
import {
  studyPlans,
  users,
  enrollments,
  quizSubmissions,
  quizzes,
  studentPerformance,
  aiSessions,
  courses,
} from "../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { sendEducationalNudge } from "../lib/email";
import { rebuildPlanFromCurrentPoint } from "./plan.builder";
import type { StudentProfile } from "./agent.orchestrator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressDashboard {
  planId: string;
  planTitle: string;
  totalCourses: number;
  completedCourses: number;
  progress: number;          // 0–100
  currentCourse: { id: string; title: string } | null;
  nextCourse: { id: string; title: string } | null;
  daysInactive: number;
  strengths: string[];
  weaknesses: string[];
  estimatedCompletionDate: string;
}

const INACTIVITY_THRESHOLD_DAYS = 7;
const HOURS_PER_COURSE = 40;

// ─── Mark course complete ─────────────────────────────────────────────────────

export async function markCourseComplete(
  userId: string,
  courseId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Upsert enrollment with 100% progress
    const [existing] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (existing) {
      await db
        .update(enrollments)
        .set({ progress: 100 })
        .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    } else {
      await db.insert(enrollments).values({ userId, courseId, progress: 100 });
    }

    // Update plan progress
    const [plan] = await db
      .select()
      .from(studyPlans)
      .where(and(eq(studyPlans.userId, userId), eq(studyPlans.status, "active")))
      .orderBy(desc(studyPlans.createdAt))
      .limit(1);

    if (plan) {
      const planData = plan.planData as any;
      const allCourses: Array<{ id: string }> = (planData.milestones || []).flatMap(
        (m: any) => m.courses || []
      );
      const completedIds = await getCompletedCourseIds(userId);
      const completedInPlan = allCourses.filter(c => completedIds.has(c.id)).length;
      const progress = Math.round((completedInPlan / allCourses.length) * 100);

      await db
        .update(studyPlans)
        .set({ progress, updatedAt: new Date() })
        .where(eq(studyPlans.id, plan.id));

      if (progress === 100) {
        await db
          .update(studyPlans)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(studyPlans.id, plan.id));
      }
    }

    return { success: true, message: "Course marked as complete" };
  } catch (err: any) {
    console.error("[TRACKER] markCourseComplete error:", err);
    return { success: false, message: err.message };
  }
}

// ─── Get completed course IDs for a user ─────────────────────────────────────

async function getCompletedCourseIds(userId: string): Promise<Set<string>> {
  const completed = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.progress, 100)));
  return new Set(completed.map(e => e.courseId));
}

// ─── Check inactivity for a single user ──────────────────────────────────────

export async function checkInactivity(userId: string): Promise<{
  isInactive: boolean;
  daysSinceActivity: number;
  reminderSent: boolean;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { isInactive: false, daysSinceActivity: 0, reminderSent: false };

  // Find the most recent activity: last login or last session update
  const [lastSession] = await db
    .select()
    .from(aiSessions)
    .where(eq(aiSessions.userId, userId))
    .orderBy(desc(aiSessions.updatedAt))
    .limit(1);

  const lastActivity = lastSession?.updatedAt || user.lastLoginAt || user.createdAt;
  const daysSince = Math.floor(
    (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince < INACTIVITY_THRESHOLD_DAYS) {
    return { isInactive: false, daysSinceActivity: daysSince, reminderSent: false };
  }

  // Find their active plan to personalise the message
  const [plan] = await db
    .select()
    .from(studyPlans)
    .where(and(eq(studyPlans.userId, userId), eq(studyPlans.status, "active")))
    .orderBy(desc(studyPlans.createdAt))
    .limit(1);

  const planTitle = plan?.title || "خطتك الدراسية";
  const progress = plan?.progress || 0;

  const content = `
    <p>لقد مضت <strong>${daysSince} أيام</strong> منذ آخر زيارة لك على المنصة!</p>
    <p>تقدمك في "${planTitle}" وصل إلى <strong>${progress}%</strong> — أنت تسير بشكل رائع!</p>
    <p>ولكن الثبات والانتظام هو سر النجاح. حتى <strong>30 دقيقة يومياً</strong> تصنع فرقاً كبيراً على المدى الطويل.</p>
    <p>عُد اليوم وأكمل رحلتك نحو ${(plan?.planData as any)?.title || "هدفك"} 🎯</p>
  `;

  const sent = await sendEducationalNudge(
    user.email,
    user.fullName,
    "reminder",
    content
  );

  return { isInactive: true, daysSinceActivity: daysSince, reminderSent: sent };
}

// ─── Bulk inactivity sweep (run as a cron job) ────────────────────────────────

export async function runInactivitySweep(): Promise<{
  checked: number;
  reminders: number;
  errors: number;
}> {
  // Get all users with active study plans
  const activePlans = await db
    .select({ userId: studyPlans.userId })
    .from(studyPlans)
    .where(eq(studyPlans.status, "active"));

  const uniqueUserIds = [...new Set(activePlans.map(p => p.userId))];

  let reminders = 0;
  let errors = 0;

  for (const userId of uniqueUserIds) {
    try {
      const result = await checkInactivity(userId);
      if (result.reminderSent) reminders++;
    } catch (e) {
      console.error(`[TRACKER] Inactivity check failed for user ${userId}:`, e);
      errors++;
    }
  }

  console.log(`[TRACKER] Sweep done: ${uniqueUserIds.length} checked, ${reminders} reminders sent, ${errors} errors`);
  return { checked: uniqueUserIds.length, reminders, errors };
}

// ─── Handle goal change ───────────────────────────────────────────────────────

export async function handleGoalChange(
  userId: string,
  sessionId: string,
  newGoal: string,
  currentProfile: StudentProfile
): Promise<{ plan: any; planId: string; message: string }> {
  // Find completed course IDs to skip in the new plan
  const completedIds = [...(await getCompletedCourseIds(userId))];

  const { plan, planId } = await rebuildPlanFromCurrentPoint(
    userId,
    sessionId,
    newGoal,
    currentProfile,
    completedIds
  );

  // Update session profile
  await db
    .update(aiSessions)
    .set({
      userProfile: { ...currentProfile, goal: newGoal } as any,
      currentState: "active_learning",
      updatedAt: new Date(),
    })
    .where(eq(aiSessions.id, sessionId));

  return {
    plan,
    planId,
    message: `تم تحديث هدفك إلى "${newGoal}" وإعادة بناء خطتك من نقطتك الحالية. تم الحفاظ على ${completedIds.length} كورسات أنجزتها سابقاً.`,
  };
}

// ─── Update student performance (strengths/weaknesses) ───────────────────────

export async function updatePerformanceProfile(
  userId: string,
  passedTopics: string[],
  failedTopics: string[]
): Promise<void> {
  const [existing] = await db
    .select()
    .from(studentPerformance)
    .where(eq(studentPerformance.userId, userId))
    .limit(1);

  if (existing) {
    const currentStrengths = (existing.strengths as string[]) || [];
    const currentWeaknesses = (existing.weaknesses as string[]) || [];

    // Add new passed topics to strengths, remove from weaknesses
    const newStrengths = [...new Set([...currentStrengths, ...passedTopics])];
    const newWeaknesses = [
      ...new Set([
        ...currentWeaknesses.filter(w => !passedTopics.includes(w)),
        ...failedTopics,
      ]),
    ];

    await db
      .update(studentPerformance)
      .set({
        strengths: newStrengths as any,
        weaknesses: newWeaknesses as any,
        lastAiAnalysisAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studentPerformance.id, existing.id));
  } else {
    await db.insert(studentPerformance).values({
      userId,
      strengths: passedTopics as any,
      weaknesses: failedTopics as any,
      lastAiAnalysisAt: new Date(),
    });
  }
}

// ─── Progress dashboard ───────────────────────────────────────────────────────

export async function getDashboard(userId: string): Promise<ProgressDashboard | null> {
  const [plan] = await db
    .select()
    .from(studyPlans)
    .where(eq(studyPlans.userId, userId))
    .orderBy(desc(studyPlans.createdAt))
    .limit(1);

  if (!plan) return null;

  const planData = plan.planData as any;
  const allCoursesInPlan: Array<{ id: string; title: string }> = (planData.milestones || []).flatMap(
    (m: any) => m.courses || []
  );

  const completedIds = await getCompletedCourseIds(userId);
  const completedCount = allCoursesInPlan.filter(c => completedIds.has(c.id)).length;

  // Find current (first incomplete) and next
  const firstIncompleteIdx = allCoursesInPlan.findIndex(c => !completedIds.has(c.id));
  const currentCourse = firstIncompleteIdx >= 0 ? allCoursesInPlan[firstIncompleteIdx] : null;
  const nextCourse = firstIncompleteIdx >= 0 && firstIncompleteIdx + 1 < allCoursesInPlan.length
    ? allCoursesInPlan[firstIncompleteIdx + 1]
    : null;

  // Calculate inactivity
  const [lastSession] = await db
    .select()
    .from(aiSessions)
    .where(eq(aiSessions.userId, userId))
    .orderBy(desc(aiSessions.updatedAt))
    .limit(1);

  const lastActivity = lastSession?.updatedAt || new Date();
  const daysInactive = Math.floor(
    (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Strengths/weaknesses
  const [perf] = await db
    .select()
    .from(studentPerformance)
    .where(eq(studentPerformance.userId, userId))
    .limit(1);

  const strengths = (perf?.strengths as string[]) || [];
  const weaknesses = (perf?.weaknesses as string[]) || [];

  // Estimated completion
  const remainingCourses = allCoursesInPlan.length - completedCount;
  const weeklyHours = planData.weeklyHours || 10;
  const remainingWeeks = Math.ceil((remainingCourses * HOURS_PER_COURSE) / weeklyHours);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + remainingWeeks * 7);
  const estimatedCompletionDate = completionDate.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    planId: plan.id,
    planTitle: plan.title,
    totalCourses: allCoursesInPlan.length,
    completedCourses: completedCount,
    progress: plan.progress,
    currentCourse,
    nextCourse,
    daysInactive,
    strengths,
    weaknesses,
    estimatedCompletionDate,
  };
}
