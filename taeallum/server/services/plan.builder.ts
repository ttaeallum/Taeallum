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

const PLAN_BUILD_ERROR_AR = "تعذر بناء الخطة الدراسية. يرجى المحاولة لاحقاً أو تعديل بياناتك ثم إعادة المحاولة.";

/**
 * Filters course IDs to only those that exist in the catalog. Returns validated layers and reasons.
 */
function filterValidCourseIds(
  catalog: CatalogCourse[],
  raw: { layer1?: string[]; layer2?: string[]; layer3?: string[]; reasons?: Record<string, string> }
): { layer1: string[]; layer2: string[]; layer3: string[]; reasons: Record<string, string> } {
  const idSet = new Set(catalog.map((c) => c.id));
  const filter = (ids: string[] | undefined): string[] =>
    (ids || []).filter((id) => idSet.has(id));
  const layer1 = filter(raw.layer1);
  const layer2 = filter(raw.layer2);
  const layer3 = filter(raw.layer3);
  const reasons: Record<string, string> = {};
  for (const id of [...layer1, ...layer2, ...layer3]) {
    if (raw.reasons && raw.reasons[id]) reasons[id] = raw.reasons[id];
  }
  return { layer1, layer2, layer3, reasons };
}

/**
 * Ensures each layer has at least one course by filling from catalog if needed.
 * Uses a single mutable set so we don't assign the same course to two layers.
 */
function ensureMinimumOnePerLayer(
  catalog: CatalogCourse[],
  layer1: string[],
  layer2: string[],
  layer3: string[],
  usedIds: Set<string>
): { layer1: string[]; layer2: string[]; layer3: string[] } {
  const used = new Set(usedIds);
  const take = (n: number, preferLevel?: string): string[] => {
    const out: string[] = [];
    let rest = catalog.filter((c) => !used.has(c.id));
    if (preferLevel) rest = rest.filter((c) => (c.level || "").toLowerCase() === preferLevel);
    for (const c of rest) {
      if (out.length >= n) break;
      out.push(c.id);
      used.add(c.id);
    }
    return out;
  };
  const l1 = layer1.length >= 1 ? layer1 : take(1, "beginner");
  l1.forEach((id) => used.add(id));
  const l2 = layer2.length >= 1 ? layer2 : take(1);
  l2.forEach((id) => used.add(id));
  const l3 = layer3.length >= 1 ? layer3 : take(1);
  l3.forEach((id) => used.add(id));
  return { layer1: l1, layer2: l2, layer3: l3 };
}

/**
 * Builds a minimal 3-layer plan using rule-based selection when AI is unavailable or fails.
 */
function buildRuleBasedPlan(
  profile: StudentProfile,
  catalog: CatalogCourse[],
  alreadyCompletedTitles: string[]
): { layer1: string[]; layer2: string[]; layer3: string[]; reasons: Record<string, string> } {
  const skipSet = new Set(alreadyCompletedTitles.map((t) => t.toLowerCase()));
  const available = catalog.filter(
    (c) => !skipSet.has(c.title.toLowerCase()) && !c.title.split(" ").some((w) => skipSet.has(w))
  );
  const byLevel = (level: string) => available.filter((c) => (c.level || "").toLowerCase() === level);
  const beginner = byLevel("beginner");
  const intermediate = byLevel("intermediate");
  const advanced = byLevel("advanced");
  const layer1 = beginner.slice(0, 3).map((c) => c.id);
  const layer2 = intermediate.slice(0, 2).map((c) => c.id);
  const layer3 = advanced.slice(0, 2).map((c) => c.id);
  const allIds = [...layer1, ...layer2, ...layer3];
  const reasons: Record<string, string> = {};
  allIds.forEach((id) => {
    const c = catalog.find((x) => x.id === id);
    reasons[id] = c ? `مقترح كجزء من مسارك نحو: ${profile.goal || "هدفك"}` : "";
  });
  return { layer1, layer2, layer3, reasons };
}

/**
 * Calls Claude to select courses for each layer. Returns validated layers (only IDs that exist in catalog).
 * Throws on API or parse failure (caller should use rule-based fallback).
 */
async function callAIForPlan(
  profile: StudentProfile,
  catalog: CatalogCourse[],
  alreadyCompletedTitles: string[]
): Promise<{ layer1: string[]; layer2: string[]; layer3: string[]; reasons: Record<string, string> }> {
  const anthropic = getAnthropic();
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not configured");

  const catalogText = catalog
    .map(
      (c) =>
        `ID: ${c.id} | Title: "${c.title}" | Category: ${c.category?.name || "General"} | Level: ${c.level} | AI_Note: ${c.aiDescription || "-"}`
    )
    .join("\n");

  const skipText =
    alreadyCompletedTitles.length > 0
      ? `\n\nCOURSES TO SKIP (student already completed):\n${alreadyCompletedTitles.map((t) => `- "${t}"`).join("\n")}`
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
3. Each layer must have at least 1 course; 2–5 courses per layer maximum (quality over quantity)
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

  const contentBlock = resp.content[0];
  const text = contentBlock && "text" in contentBlock ? contentBlock.text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned no JSON");
  const parsed = JSON.parse(match[0]) as { layer1?: string[]; layer2?: string[]; layer3?: string[]; reasons?: Record<string, string> };
  return filterValidCourseIds(catalog, parsed);
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

/**
 * Builds a 3-layer study plan for the student. Uses AI when available; falls back to rule-based
 * selection on failure. Validates all course IDs against the database and ensures each layer
 * has at least one course. Throws with an Arabic error message if the plan cannot be built.
 */
export async function buildPlan(
  profile: StudentProfile,
  userId: string,
  sessionId: string
): Promise<{ plan: StudyPlan; planId: string }> {

  // 1. Fetch real catalog from DB
  const catalog = await fetchCatalog();
  if (catalog.length === 0) throw new Error(PLAN_BUILD_ERROR_AR);

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

  // 5. Call AI to select course IDs; on failure use rule-based fallback
  let aiSelection: { layer1: string[]; layer2: string[]; layer3: string[]; reasons: Record<string, string> };
  try {
    aiSelection = await callAIForPlan(profile, availableCatalog, allCompletedTitles);
  } catch (e) {
    console.error("[PLAN_BUILDER] AI plan failed, using rule-based fallback", e);
    aiSelection = buildRuleBasedPlan(profile, availableCatalog, allCompletedTitles);
  }

  // 5b. Ensure each layer has at least 1 course (fill from catalog if needed)
  const usedIds = new Set([
    ...aiSelection.layer1,
    ...aiSelection.layer2,
    ...aiSelection.layer3,
  ]);
  const { layer1: l1, layer2: l2, layer3: l3 } = ensureMinimumOnePerLayer(
    availableCatalog,
    aiSelection.layer1,
    aiSelection.layer2,
    aiSelection.layer3,
    usedIds
  );
  aiSelection = { ...aiSelection, layer1: l1, layer2: l2, layer3: l3 };

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

  if (milestones.length === 0) {
    throw new Error(PLAN_BUILD_ERROR_AR);
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
      planData: plan as Record<string, unknown>,
      status: "active",
    })
    .returning();

  // 10. Update session with generated plan
  await db
    .update(aiSessions)
    .set({
      generatedPlan: plan as Record<string, unknown>,
      currentState: "active_learning",
      updatedAt: new Date(),
    })
    .where(eq(aiSessions.id, sessionId));

  return { plan, planId: savedPlan.id };
}

// ─── Rebuild plan from current point (goal change) ───────────────────────────

/**
 * Builds a new plan from the current point after the student changes goal or profile.
 * Marks previous plan as abandoned and reuses completed courses as skipped.
 */
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

/**
 * Builds a StudyPlan from the direct output of the PathAgent.
 * This bypasses AI selection and uses the IDs specifically picked by the agent.
 */
export async function buildPlanFromAgentOutput(
  agentOutput: any,
  userId: string,
  sessionId: string
): Promise<{ plan: StudyPlan; planId: string }> {
  const catalog = await fetchCatalog();
  const HOURS_PER_COURSE = 40;

  const lp = agentOutput.learning_path || [];
  const planCourses: PlanCourse[] = [];
  let currentWeek = 1;

  for (const item of lp) {
    const c = catalog.find((x) => x.id === item.course_id);
    if (!c) continue;

    const weeks = item.estimated_weeks || 2;
    planCourses.push({
      id: c.id,
      title: c.title,
      slug: c.slug,
      thumbnail: c.thumbnail,
      level: c.level,
      categoryName: c.category?.name || "عام",
      totalHours: HOURS_PER_COURSE,
      startWeek: currentWeek,
      endWeek: currentWeek + weeks - 1,
      reason: item.reason || "",
    });
    currentWeek += weeks;
  }

  const plan: StudyPlan = {
    title: `خطتك التعليمية لبناء مسار ${lp[0]?.course_name || "الاحتراف"}`,
    description: agentOutput.encouragement_message || "خطة دراسية مخصصة مبنية على أهدافك.",
    duration: agentOutput.total_duration || `${currentWeek - 1} أسابيع`,
    totalHours: planCourses.length * HOURS_PER_COURSE,
    totalWeeks: currentWeek - 1,
    weeklyHours: 10, // Default for now
    milestones: [
      {
        layer: 1,
        title: "المسار التعليمي الشامل",
        description: "جميع الكورسات المطلوبة للوصول لهدفك",
        courses: planCourses,
        weeklyHours: 10,
        durationWeeks: currentWeek - 1,
      },
    ],
  };

  // Persist to DB
  const [savedPlan] = await db
    .insert(studyPlans)
    .values({
      userId,
      sessionId,
      title: plan.title,
      description: plan.description,
      duration: plan.duration,
      totalHours: plan.totalHours,
      planData: plan as Record<string, unknown>,
      status: "active",
    })
    .returning();

  // Update session
  await db
    .update(aiSessions)
    .set({
      generatedPlan: plan as Record<string, unknown>,
      currentState: "active_learning",
      updatedAt: new Date(),
    })
    .where(eq(aiSessions.id, sessionId));

  return { plan, planId: savedPlan.id };
}
