/**
 * PlanBuilder — builds a 3-layer personalized study plan
 *
 * Layer 1: CS Core        — only the foundational courses THIS student needs
 * Layer 2: Sector Core    — shared courses for their specialization sector
 * Layer 3: Deep Spec      — advanced courses for the exact job/role they want
 *
 * Rules enforced:
 * - ONLY uses courses from the live database (no hallucinated courses)
 * - NEVER includes courses the student says they already completed
 * - Duration calculated from actual weeklyHours (40h per course baseline)
 * - Returns course IDs, slugs, thumbnails so the frontend can link directly
 */

import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "../config";
import { db } from "../db";
import { courses, studyPlans, aiSessions, enrollments } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import type { StudentProfile } from "./agent.orchestrator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  level: string;
  categoryName: string;
  totalHours: number;      // always 40 as baseline per course
  startWeek: number;
  endWeek: number;
  reason: string;          // why this course is in this student's plan
}

export interface PlanMilestone {
  layer: 1 | 2 | 3;
  title: string;
  description: string;
  courses: PlanCourse[];
  weeklyHours: number;
  durationWeeks: number;
}

export interface StudyPlan {
  title: string;
  description: string;
  duration: string;        // e.g. "6 أشهر"
  totalHours: number;
  totalWeeks: number;
  weeklyHours: number;
  milestones: PlanMilestone[];
}

interface CatalogCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  level: string;
  aiDescription: string | null;
  category: { id: string; name: string } | null;
}

// ─── Fetch live catalog ───────────────────────────────────────────────────────

async function fetchCatalog(): Promise<CatalogCourse[]> {
  const rows = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    with: { category: true },
  });
  return rows as CatalogCourse[];
}

async function fetchEnrolledCourseIds(userId: string): Promise<Set<string>> {
  const enrolled = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(eq(enrollments.userId, userId));
  return new Set(enrolled.map((e) => e.courseId));
}

// ─── AI call to build layered plan ───────────────────────────────────────────

function getAnthropic(): Anthropic | null {
  const key = getConfig("ANTHROPIC_API_KEY");
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

async function callAIForPlan(
  profile: StudentProfile,
  catalog: CatalogCourse[],
  alreadyCompletedTitles: string[]
): Promise<{ layer1: string[]; layer2: string[]; layer3: string[]; reasons: Record<string, string> }> {

  const anthropic = getAnthropic();
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not configured");

  const catalogText = catalog.map(c =>
    `ID: ${c.id} | Title: "${c.title}" | Category: ${c.category?.name || "General"} | Level: ${c.level} | AI_Note: ${c.aiDescription || "-"}`
  ).join("\n");

  const skipText = alreadyCompletedTitles.length > 0
    ? `\n\nCOURSES TO SKIP (student already completed):\n${alreadyCompletedTitles.map(t => `- "${t}"`).join("\n")}`
    : "\n\n(Student has no prior completed courses.)";

  const prompt = `You are a curriculum architect for the Taallm Arabic learning platform.

STUDENT PROFILE:
- Goal: ${profile.goal}
- Current Level: ${profile.level}
- Weekly Study Hours: ${profile.weeklyHours}h/week
- Already Completed: ${alreadyCompletedTitles.join(", ") || "Nothing"}

AVAILABLE COURSES IN OUR DATABASE (use ONLY these IDs):
${catalogText}
${skipText}

TASK: Select the MINIMUM necessary courses from the catalog above to take this student from their current level to their goal, split into 3 layers:

LAYER 1 — CS Core Foundation (only courses THIS student genuinely needs — not all CS courses):
  - For web/mobile devs: skip Linear Algebra, skip Probability unless needed
  - For AI engineers: include Linear Algebra, Probability & Statistics
  - For cybersecurity: include Networking, Operating Systems — skip math-heavy courses

LAYER 2 — Sector Foundation (shared foundation courses for the student's specialization sector)

LAYER 3 — Deep Specialization (advanced courses for the exact role/job the student wants)

STRICT RULES:
1. Only use course IDs from the catalog above — NEVER invent courses
2. Never include courses from the "COURSES TO SKIP" list
3. Each layer should have 2–5 courses maximum (quality over quantity)
4. Select courses where the title/description best matches the layer's purpose

Return ONLY this JSON (no extra text):
{
  "layer1": ["course-id-1", "course-id-2"],
  "layer2": ["course-id-3", "course-id-4"],
  "layer3": ["course-id-5", "course-id-6"],
  "reasons": {
    "course-id-1": "short Arabic reason why this course is in this student's plan",
    "course-id-2": "..."
  }
}`;

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (resp.content[0] as any).text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned no JSON");
  return JSON.parse(match[0]);
}

// ─── Assemble the plan from AI selections ─────────────────────────────────────

function buildMilestone(
  layer: 1 | 2 | 3,
  titles: Record<1 | 2 | 3, string>,
  descriptions: Record<1 | 2 | 3, string>,
  courseIds: string[],
  catalog: CatalogCourse[],
  reasons: Record<string, string>,
  weeklyHours: number,
  startWeekOffset: number
): PlanMilestone {
  const HOURS_PER_COURSE = 40;
  let currentWeek = startWeekOffset;
  const planCourses: PlanCourse[] = [];

  for (const id of courseIds) {
    const c = catalog.find(x => x.id === id);
    if (!c) continue;

    const weeksForCourse = Math.ceil(HOURS_PER_COURSE / weeklyHours);
    planCourses.push({
      id: c.id,
      title: c.title,
      slug: c.slug,
      thumbnail: c.thumbnail,
      level: c.level,
      categoryName: c.category?.name || "عام",
      totalHours: HOURS_PER_COURSE,
      startWeek: currentWeek,
      endWeek: currentWeek + weeksForCourse - 1,
      reason: reasons[id] || "",
    });
    currentWeek += weeksForCourse;
  }

  const totalDurationWeeks = planCourses.reduce(
    (sum, c) => sum + (c.endWeek - c.startWeek + 1),
    0
  );

  return {
    layer,
    title: titles[layer],
    description: descriptions[layer],
    courses: planCourses,
    weeklyHours,
    durationWeeks: totalDurationWeeks,
  };
}

// ─── Main exported function ───────────────────────────────────────────────────

export async function buildPlan(
  profile: StudentProfile,
  userId: string,
  sessionId: string
): Promise<{ plan: StudyPlan; planId: string }> {

  // 1. Fetch real catalog from DB
  const catalog = await fetchCatalog();
  if (catalog.length === 0) throw new Error("No published courses found in database");

  // 2. Get courses the user is already enrolled in (treat as completed)
  const enrolledIds = await fetchEnrolledCourseIds(userId);
  const enrolledTitles = catalog
    .filter(c => enrolledIds.has(c.id))
    .map(c => c.title);

  // 3. Merge with self-reported completed courses
  const allCompletedTitles = [
    ...new Set([
      ...(profile.completedCourses || []),
      ...enrolledTitles,
    ]),
  ];

  // 4. Filter catalog: remove courses already completed
  const availableCatalog = catalog.filter(c =>
    !allCompletedTitles.some(title =>
      c.title.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().includes(c.title.toLowerCase().substring(0, 10))
    )
  );

  // 5. Call AI to select course IDs for each layer
  const aiSelection = await callAIForPlan(profile, availableCatalog, allCompletedTitles);

  // 6. Assemble milestones
  const weeklyHours = profile.weeklyHours || 10;
  const HOURS_PER_COURSE = 40;

  const LAYER_TITLES = {
    1: "المستوى الأول — أساسيات علوم الحاسوب",
    2: "المستوى الثاني — أساسيات التخصص",
    3: "المستوى الثالث — التخصص الاحترافي العميق",
  } as const;

  const LAYER_DESCS = {
    1: `الأساس الضروري لهدفك — تعلّم المفاهيم التقنية الأساسية اللازمة للوصول إلى ${profile.goal}`,
    2: `بناء خبرتك في مجال التخصص الذي تريده بخطوات عملية ومنظمة`,
    3: `التخصص الاحترافي العميق في مجال ${profile.goal} للوصول لمستوى احترافي قابل للتوظيف`,
  } as const;

  let weekOffset = 1;
  const milestones: PlanMilestone[] = [];

  for (const layer of [1, 2, 3] as const) {
    const layerKey = layer === 1 ? "layer1" : layer === 2 ? "layer2" : "layer3";
    const ids = aiSelection[layerKey] || [];
    if (ids.length === 0) continue;

    const milestone = buildMilestone(
      layer,
      LAYER_TITLES,
      LAYER_DESCS,
      ids,
      availableCatalog,
      aiSelection.reasons || {},
      weeklyHours,
      weekOffset
    );
    milestones.push(milestone);
    weekOffset += milestone.durationWeeks;
  }

  // 7. Calculate totals
  const totalWeeks = milestones.reduce((sum, m) => sum + m.durationWeeks, 0);
  const totalCourses = milestones.reduce((sum, m) => sum + m.courses.length, 0);
  const totalHours = totalCourses * HOURS_PER_COURSE;
  const months = Math.ceil(totalWeeks / 4);

  // 8. Build plan title
  const plan: StudyPlan = {
    title: `مسار ${profile.goal} — من ${profile.level === "beginner" ? "الصفر" : "مستواك الحالي"} إلى الاحتراف`,
    description: `خطة دراسية مخصصة لك لتصبح ${profile.goal}. تحتوي على ${totalCourses} كورسات منتقاة من منصة تعلّم، مبنية على ساعاتك الأسبوعية البالغة ${weeklyHours} ساعة. المدة الإجمالية: ${months} أشهر.`,
    duration: `${months} أشهر`,
    totalHours,
    totalWeeks,
    weeklyHours,
    milestones,
  };

  // 9. Persist to DB
  const [savedPlan] = await db
    .insert(studyPlans)
    .values({
      userId,
      sessionId,
      title: plan.title,
      description: plan.description,
      duration: plan.duration,
      totalHours,
      planData: plan as any,
      status: "active",
    })
    .returning();

  // 10. Update session with generated plan
  await db
    .update(aiSessions)
    .set({
      generatedPlan: plan as any,
      currentState: "active_learning",
      updatedAt: new Date(),
    })
    .where(eq(aiSessions.id, sessionId));

  return { plan, planId: savedPlan.id };
}

// ─── Rebuild plan from current point (goal change) ───────────────────────────

export async function rebuildPlanFromCurrentPoint(
  userId: string,
  sessionId: string,
  newGoal: string,
  newProfile: StudentProfile,
  completedCourseIds: string[]
): Promise<{ plan: StudyPlan; planId: string }> {

  // Mark old plan as abandoned
  await db
    .update(studyPlans)
    .set({ status: "abandoned", updatedAt: new Date() })
    .where(eq(studyPlans.userId, userId));

  // Fetch titles of already-completed courses to skip
  const completedRows = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
  });
  const completedTitles = completedRows
    .filter(c => completedCourseIds.includes(c.id))
    .map(c => c.title);

  const updatedProfile: StudentProfile = {
    ...newProfile,
    goal: newGoal,
    completedCourses: [
      ...(newProfile.completedCourses || []),
      ...completedTitles,
    ],
    confirmed: true,
  };

  return buildPlan(updatedProfile, userId, sessionId);
}
