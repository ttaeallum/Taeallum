/**
 * AgentOrchestrator — deterministic 5-step onboarding state machine
 *
 * States (in strict order):
 *   1. ASK_GOAL            → "What exactly do you want to become?"
 *   2. ASK_LEVEL           → "What is your current level?"
 *   3. ASK_COMPLETED       → "What courses/topics have you already studied?"
 *   4. ASK_HOURS           → "How many hours per week can you study?"
 *   5. CONFIRM_PROFILE     → Summarise + confirm before building plan
 *   6. PLAN_READY          → Hand off to PlanBuilder
 *
 * One question per turn — never two at once.
 * Never re-asks a question already answered.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "../config";
import { db } from "../db";
import { aiSessions, aiMessages } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentState =
  | "ask_goal"
  | "ask_level"
  | "ask_completed"
  | "ask_hours"
  | "confirm_profile"
  | "plan_ready"
  | "active_learning";

export interface StudentProfile {
  goal?: string;          // e.g. "Full-Stack Web Developer using React"
  level?: "beginner" | "intermediate" | "advanced";
  completedCourses?: string[];   // course titles or topics already done
  weeklyHours?: number;          // hours per week available
  confirmed?: boolean;
}

export interface OrchestratorResponse {
  message: string;
  suggestions: string[];
  state: AgentState;
  profile: StudentProfile;
  action: "ask" | "confirm" | "build_plan" | "error";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATE_ORDER: AgentState[] = [
  "ask_goal",
  "ask_level",
  "ask_completed",
  "ask_hours",
  "confirm_profile",
  "plan_ready",
];

const QUESTIONS: Record<AgentState, { prompt: string; suggestions: string[] }> = {
  ask_goal: {
    prompt: `مرحباً! 👋 أنا مرشدك الذكي في منصة تعلّم.

سأبني لك خطة دراسية مخصصة تماماً لهدفك.

**السؤال الأول:** ما هو هدفك الدقيق؟ (مش "أتعلم تقنية" — بالضبط شو تريد تصير؟)

مثلاً: مطوّر تطبيقات ويب، مهندس ذكاء اصطناعي، متخصص أمن سيبراني...`,
    suggestions: [
      "مطوّر تطبيقات ويب (Full Stack)",
      "مهندس ذكاء اصطناعي وتعلم آلة",
      "متخصص أمن سيبراني (Ethical Hacker)",
      "مطوّر تطبيقات موبايل",
      "مهندس بيانات وتحليلات",
    ],
  },
  ask_level: {
    prompt: `ممتاز! هدف واضح ومحدد 💪

**السؤال الثاني:** ما هو مستواك الحالي في البرمجة والتقنية؟`,
    suggestions: [
      "مبتدئ تماماً — لا أعرف شيئاً",
      "عندي أساس — درست بعض المواد",
      "متوسط — عملت مشاريع صغيرة",
      "متقدم — أبحث عن تخصص محدد",
    ],
  },
  ask_completed: {
    prompt: `**السؤال الثالث:** شو درست سابقاً؟

اذكر أي كورسات أو مواد أنهيتها (سأتجاهلها تلقائياً في خطتك لئلا تكرر ما تعلمته).

إذا لم تدرس شيئاً بعد، اكتب "لا شيء".`,
    suggestions: [
      "لا شيء — أبدأ من الصفر",
      "درست أساسيات البرمجة (Python/C++)",
      "درست HTML/CSS وجاڤاسكريبت",
      "درست الشبكات والأنظمة",
      "درست رياضيات وإحصاء",
    ],
  },
  ask_hours: {
    prompt: `**السؤال الرابع:** كم ساعة بالأسبوع تستطيع تخصيصها للدراسة؟

سأحسب مدة الخطة بناءً على ذلك (كل كورس يحتاج تقريباً 40 ساعة).`,
    suggestions: [
      "5 ساعات أسبوعياً",
      "10 ساعات أسبوعياً",
      "15 ساعات أسبوعياً",
      "20 ساعة أسبوعياً أو أكثر",
    ],
  },
  confirm_profile: {
    prompt: "", // built dynamically
    suggestions: ["نعم، ابنِ خطتي الآن! 🚀", "لا، أريد تعديل شيء"],
  },
  plan_ready: {
    prompt: "خطتك جاهزة! 🎯",
    suggestions: [],
  },
  active_learning: {
    prompt: "أنت في مرحلة التعلم الفعلية.",
    suggestions: [],
  },
};

// ─── Helper: extract data from user message via AI ───────────────────────────

function getAnthropic(): Anthropic | null {
  try {
    const key = getConfig("ANTHROPIC_API_KEY");
    if (!key) return null;
    return new Anthropic({ apiKey: key });
  } catch {
    return null;
  }
}

async function extractFromMessage(
  state: AgentState,
  userMessage: string
): Promise<Partial<StudentProfile>> {
  const anthropic = getAnthropic();
  if (!anthropic) return parseManually(state, userMessage);

  const extractionPrompts: Record<string, string> = {
    ask_goal: `Extract the student's career goal from this message. Return JSON: { "goal": "exact career goal in Arabic" }. Message: "${userMessage}"`,
    ask_level: `Extract the student's programming level from this message. Return JSON: { "level": "beginner|intermediate|advanced" }. Map: no experience→beginner, some basics→beginner, did small projects→intermediate, experienced→advanced. Message: "${userMessage}"`,
    ask_completed: `Extract a list of courses/topics the student has already completed from this message. Return JSON: { "completedCourses": ["course1", "course2"] }. If they said nothing/zero return []. Message: "${userMessage}"`,
    ask_hours: `Extract the weekly study hours from this message. Return JSON: { "weeklyHours": number }. Convert any text to a number (e.g. "5 hours" → 5, "half a day" → 4). Message: "${userMessage}"`,
  };

  try {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{ role: "user", content: extractionPrompts[state] || "" }],
    });
    const text = (resp.content[0] as any).text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("[ORCHESTRATOR] Extraction failed, using manual parse:", e);
  }

  return parseManually(state, userMessage);
}

function parseManually(state: AgentState, msg: string): Partial<StudentProfile> {
  const lower = msg.toLowerCase();
  if (state === "ask_level") {
    if (lower.includes("مبتدئ") || lower.includes("لا أعرف") || lower.includes("صفر") || lower.includes("beginner")) return { level: "beginner" };
    if (lower.includes("متوسط") || lower.includes("intermediate") || lower.includes("مشاريع")) return { level: "intermediate" };
    if (lower.includes("متقدم") || lower.includes("advanced") || lower.includes("خبر")) return { level: "advanced" };
    return { level: "beginner" };
  }
  if (state === "ask_hours") {
    const num = msg.match(/\d+/);
    return { weeklyHours: num ? parseInt(num[0]) : 10 };
  }
  if (state === "ask_completed") {
    if (lower.includes("لا شيء") || lower.includes("لا") || lower.includes("nothing") || lower.includes("صفر")) return { completedCourses: [] };
    return { completedCourses: [msg.trim()] };
  }
  if (state === "ask_goal") {
    return { goal: msg.trim() };
  }
  return {};
}

// ─── State Machine ────────────────────────────────────────────────────────────

function nextState(current: AgentState, profile: StudentProfile): AgentState {
  if (!profile.goal)           return "ask_goal";
  if (!profile.level)          return "ask_level";
  if (!profile.completedCourses) return "ask_completed";
  if (!profile.weeklyHours)    return "ask_hours";
  if (!profile.confirmed)      return "confirm_profile";
  return "plan_ready";
}

function buildConfirmMessage(profile: StudentProfile): string {
  const hours = profile.weeklyHours || 0;
  const coursesPerWeek = 40 / hours;
  const estimatedCourses = 8; // rough average plan length
  const totalWeeks = Math.ceil(estimatedCourses * coursesPerWeek);
  const months = Math.ceil(totalWeeks / 4);

  const completed = (profile.completedCourses || []).length > 0
    ? `\n- ✅ **الكورسات المكتملة:** ${profile.completedCourses!.join("، ")} (سأتجاوزها)`
    : "\n- ✅ **مستوى البداية:** من الصفر";

  return `ممتاز! لقد فهمت ملفك الكامل. دعني أتأكد:

- 🎯 **هدفك:** ${profile.goal}
- 📊 **مستواك:** ${profile.level === "beginner" ? "مبتدئ" : profile.level === "intermediate" ? "متوسط" : "متقدم"}${completed}
- ⏰ **ساعاتك الأسبوعية:** ${hours} ساعات
- 📅 **المدة المتوقعة:** ~${months} أشهر (${totalWeeks} أسبوع)

هل هذا صحيح؟ هل أبدأ ببناء خطتك الدراسية المخصصة؟`;
}

// ─── Main Orchestrator Function ───────────────────────────────────────────────

export async function orchestrate(
  sessionId: string,
  userId: string,
  userMessage: string,
  currentProfile: StudentProfile,
  currentState: AgentState
): Promise<OrchestratorResponse> {
  // 1. Determine current state from profile (source of truth)
  const state = nextState(currentState, currentProfile);

  // 2. Extract data from user's message based on current state
  let updatedProfile = { ...currentProfile };

  if (state !== "confirm_profile" && state !== "plan_ready" && state !== "active_learning") {
    const extracted = await extractFromMessage(state, userMessage);
    updatedProfile = { ...updatedProfile, ...extracted };
  }

  // 3. Handle confirmation step
  if (state === "confirm_profile") {
    const lower = userMessage.toLowerCase();
    const confirmed = lower.includes("نعم") || lower.includes("ابنِ") || lower.includes("ابني") ||
                      lower.includes("yes") || lower.includes("صح") || lower.includes("🚀");
    if (confirmed) {
      updatedProfile.confirmed = true;
      return {
        message: "🚀 رائع! جاري بناء خطتك الدراسية المخصصة من الكورسات الفعلية على المنصة...",
        suggestions: [],
        state: "plan_ready",
        profile: updatedProfile,
        action: "build_plan",
      };
    } else {
      // They want to edit — reset confirmation, go back to goal
      updatedProfile.confirmed = false;
      updatedProfile.goal = undefined;
      return {
        message: "لا مشكلة! دعنا نعيد من البداية. " + QUESTIONS.ask_goal.prompt,
        suggestions: QUESTIONS.ask_goal.suggestions,
        state: "ask_goal",
        profile: updatedProfile,
        action: "ask",
      };
    }
  }

  // 4. Recompute state after extraction
  const newState = nextState("ask_goal", updatedProfile);

  // 5. Build response for next question
  if (newState === "confirm_profile") {
    return {
      message: buildConfirmMessage(updatedProfile),
      suggestions: QUESTIONS.confirm_profile.suggestions,
      state: "confirm_profile",
      profile: updatedProfile,
      action: "confirm",
    };
  }

  if (newState === "plan_ready") {
    return {
      message: "🚀 جاري بناء خطتك...",
      suggestions: [],
      state: "plan_ready",
      profile: updatedProfile,
      action: "build_plan",
    };
  }

  const q = QUESTIONS[newState];
  return {
    message: q.prompt,
    suggestions: q.suggestions,
    state: newState,
    profile: updatedProfile,
    action: "ask",
  };
}

// ─── Session persistence helpers ──────────────────────────────────────────────

export async function getOrCreateSession(userId: string) {
  const [existing] = await db
    .select()
    .from(aiSessions)
    .where(and(eq(aiSessions.userId, userId), eq(aiSessions.status, "active")))
    .orderBy(desc(aiSessions.updatedAt))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(aiSessions)
    .values({
      userId,
      sessionType: "onboarding",
      currentState: "ask_goal",
      userProfile: {},
    })
    .returning();

  return created;
}

export async function saveMessage(sessionId: string, role: "user" | "assistant", content: string, metadata?: object) {
  await db.insert(aiMessages).values({ sessionId, role, content, metadata: metadata as any });
}

export async function updateSession(sessionId: string, state: AgentState, profile: StudentProfile) {
  await db
    .update(aiSessions)
    .set({
      currentState: state,
      userProfile: profile as any,
      updatedAt: new Date(),
    })
    .where(eq(aiSessions.id, sessionId));
}
