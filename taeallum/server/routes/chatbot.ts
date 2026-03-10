import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "./auth";
import { db } from "../db";
import { aiSessions, aiMessages, users, studyPlans, students } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getConfig } from "../config";

const router = Router();

// --- 1. Constants & Types ---
const TAALLM_COURSES = {
    core: [
        "Introduction to Programming",
        "Structured Programming",
        "Object Oriented Programming",
        "Data Structures & Algorithms",
        "Linear Algebra",
        "Prompting & Pipelines",
        "Numerical Analysis",
        "Data Communication & Networks",
        "Operating Systems"
    ],
    specializations: {
        "Software Development": [
            "Web Development", "Front Technologies", "Backend Development",
            "Full Stack Development", "Database Development",
            "Mobile Development", "Mobile UX/UI", "Bloc-Platform Apps"
        ],
        "Artificial Intelligence": [
            "Artificial Intelligence", "Machine Learning", "Deep Learning",
            "Natural Language Processing", "Computer Vision",
            "Text Mining", "Object Detection", "Visual Development"
        ],
        "Cybersecurity": [
            "Network Security", "Ethical Hacking", "Cryptography",
            "Security Testing", "Capture Forensics",
            "Malware Analysis", "Mobile Testing"
        ],
        "Data Science": [
            "Data Analytics", "Data Visualisation", "Statistical Analysis",
            "Big Data Technologies", "Business Intelligence",
            "Big Data Tools", "Data Warehousing", "NoSQL Databases"
        ],
        "Network & Management": [
            "Network Administration", "Network Configurations",
            "Routing & Switching", "Network Security", "Wireless Networks"
        ],
        "Network & Cloud Computing": [
            "Cloud Architecture", "Cloud Security", "Cloud Governance",
            "Container Regulation", "Infrastructure as Code"
        ],
        "Game Development": [
            "Game Design", "Game Parsing", "Laws & Design",
            "Interactive Storytelling", "Game Theory", "3D Graphics",
            "3D Modelling", "Game Animation", "Shader Programming"
        ],
        "IT Management": [
            "IT Project Management", "Project Planning", "Project Execution",
            "IT Project Tools", "Risk Management", "IT Service Management",
            "Agile & Scrum", "IT Project Problem", "Data Management"
        ]
    }
};

/** Session shape attached by requireAuth / express-session. */
interface AuthSession {
  userId?: string;
  isAdmin?: boolean;
}

interface RequestWithAuth extends Request {
  session: AuthSession;
}

const getOpenAI = (): OpenAI | null => {
    try {
        const key = getConfig("OPENAI_API_KEY");
        if (!key) {
            console.error("[AI-ENGINE] Missing OPENAI_API_KEY");
            return null;
        }
        return new OpenAI({ apiKey: key });
    } catch (err) {
        return null;
    }
};

const getAnthropic = (): Anthropic | null => {
    try {
        const key = getConfig("ANTHROPIC_API_KEY");
        if (!key) return null;
        return new Anthropic({ apiKey: key });
    } catch {
        return null;
    }
};

// --- Chatbot response type and validation ---
interface ChatbotCollectedData {
    goal?: string;
    level?: "beginner" | "intermediate" | "advanced";
    completed_courses?: string[];
    weekly_hours?: number;
    sector?: string;
    specialization?: string;
    experience?: string;
}

interface ChatbotPhase {
    phase: number;
    title: string;
    duration_months: number;
    courses: string[];
    reason: string;
}

interface ChatbotStudyPlan {
    total_months?: number;
    phases?: ChatbotPhase[];
}

interface ChatbotAIResponse {
    message: string;
    suggestions: string[];
    action?: "none" | "show_plan" | "redirect";
    collected_data?: ChatbotCollectedData;
    study_plan?: ChatbotStudyPlan;
}

const FALLBACK_RESPONSE: ChatbotAIResponse = {
    message: "عذراً، حدث خطأ في معالجة الطلب. يرجى المحاولة لاحقاً.",
    suggestions: [],
};

const UNCLEAR_FALLBACK_MESSAGE = "لم أفهم إجابتك بشكل كامل. هل يمكنك توضيح ذلك؟ مثلاً: حدّد هدفك بدقّة، أو مستواك (مبتدئ / متوسط / متقدم)، أو عدد الساعات أسبوعياً.";

/**
 * Builds the structured Arabic system prompt for the chatbot.
 * Uses فصحى مبسطة (simplified Modern Standard Arabic) for consistency.
 */
function buildChatbotSystemPrompt(coursesList: typeof TAALLM_COURSES): string {
    return `
أنت "تعلّم" — مستشار تعليمي ذكي على منصة تعلّم. تستخدم العربية الفصحى المبسطة (واضحة، قريبة من المحكية دون عامية).

━━━━━━━━━━━━━━━━━━━━━━━━
# متى تسأل ومتى تبني الخطة
━━━━━━━━━━━━━━━━━━━━━━━━
• اسأل: عندما ينقصك أي من الأربعة: الهدف الدقيق، المستوى الحالي، ما أكمله سابقاً، الساعات الأسبوعية.
• ابنِ الخطة: فقط عندما تملك الأربعة كاملة وواضحة. لا تبني قبلها.
• إذا كانت إجابة الطالب غامضة أو غير كاملة: اطلب التوضيح بلطف (مثلاً: "لم أفهم تماماً — هل تقصد أن هدفك X؟" أو "كم ساعة تقريباً في الأسبوع؟").

━━━━━━━━━━━━━━━━━━━━━━━━
# البيانات الأربعة المطلوبة (بالترتيب)
━━━━━━━━━━━━━━━━━━━━━━━━
1. الهدف الدقيق: ماذا يريد أن يصبح (مثال: مطوّر ويب، مهندس ذكاء اصطناعي) — ليس مجرد "أتعلم برمجة".
2. المستوى: beginner | intermediate | advanced (مبتدئ / متوسط / متقدم).
3. ما أكمله سابقاً: قائمة كورسات أو مواد — إن لم يدرس شيئاً فاستخدم مصفوفة فارغة.
4. الساعات الأسبوعية: رقم (مثلاً 10).

━━━━━━━━━━━━━━━━━━━━━━━━
# الكورسات المتاحة على تعلّم فقط
━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(coursesList, null, 2)}
⚠️ لا تقترح أي كورس خارج هذه القائمة أبداً.

━━━━━━━━━━━━━━━━━━━━━━━━
# منطق المسار (3 طبقات)
━━━━━━━━━━━━━━━━━━━━━━━━
الطبقة 1 — Core: فقط ما يحتاجه هذا الطالب من أساسيات (مثلاً مطوّر ويب لا يحتاج Linear Algebra).
الطبقة 2 — Sector: المواد المشتركة لتخصصه.
الطبقة 3 — Specialized: المواد المتقدمة لهدفه بالضبط.

━━━━━━━━━━━━━━━━━━━━━━━━
# صيغة الرد — JSON فقط، بدون نص إضافي
━━━━━━━━━━━━━━━━━━━━━━━━
يجب أن يكون ردك كائناً JSON صالحاً بالضبط بهذا الشكل. لا تضف تعليقات أو نصاً قبله أو بعده.

مثال صحيح:
{
  "message": "ممتاز، فهمت هدفك. ما مستواك الحالي في البرمجة؟",
  "suggestions": ["مبتدئ تماماً", "لدي أساس", "متوسط", "متقدم"],
  "action": "none",
  "collected_data": {
    "goal": "مطوّر تطبيقات ويب",
    "level": null,
    "completed_courses": [],
    "weekly_hours": null
  }
}

عند اكتمال البيانات الأربعة وعند تأكيد الطالب، أرسل:
{
  "message": "جاري بناء خطتك...",
  "suggestions": [],
  "action": "show_plan",
  "collected_data": { ... كل الحقول ... },
  "study_plan": {
    "total_months": 6,
    "phases": [
      { "phase": 1, "title": "أساسيات", "duration_months": 2, "courses": ["كورس 1", "كورس 2"], "reason": "..." }
    ]
  }
}

الحقول الإلزامية في كل رد: "message" (string), "suggestions" (array of strings), "action" (one of: "none", "show_plan", "redirect").
collected_data اختياري لكن مطلوب عند جمع المعلومات؛ استخدمه لتحديث goal, level, completed_courses, weekly_hours فقط من رسالة الطالب الحالية.

━━━━━━━━━━━━━━━━━━━━━━━━
# إجابات غامضة أو غير واضحة
━━━━━━━━━━━━━━━━━━━━━━━━
إذا لم تستطع استخراج المعلومة المطلوبة (مثلاً الطالب كتب "لا أدري" أو جملة غير ذات صلة):
• املأ collected_data فقط بما استطعت استنتاجه، واترك الباقي null أو [].
• في "message" اطلب التوضيح بأدب: "لم أفهم [السؤال]. هل يمكنك أن توضح؟" مع إعادة السؤال بشكل مختصر.

━━━━━━━━━━━━━━━━━━━━━━━━
# شخصيتك وممنوعات
━━━━━━━━━━━━━━━━━━━━━━━━
• فصحى مبسطة، ودود، مختصر، صادق.
• ممنوع: اقتراح كورس خارج القائمة، إعطاء خطة قبل اكتمال البيانات الأربعة، تكرار سؤال أجاب عنه الطالب، تكرار الترحيب في كل رسالة.
`;
}

/**
 * Parses and validates LLM JSON output into ChatbotAIResponse.
 * Returns fallback response if parsing fails or message is missing.
 */
function parseAndValidateChatbotResponse(raw: string | null | undefined): ChatbotAIResponse {
    if (!raw || typeof raw !== "string") return FALLBACK_RESPONSE;
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (!parsed || typeof parsed.message !== "string") return FALLBACK_RESPONSE;
        return {
            message: parsed.message,
            suggestions: Array.isArray(parsed.suggestions) ? (parsed.suggestions as string[]) : [],
            action: parsed.action === "show_plan" || parsed.action === "redirect" ? parsed.action : "none",
            collected_data: parsed.collected_data as ChatbotCollectedData | undefined,
            study_plan: parsed.study_plan as ChatbotStudyPlan | undefined,
        };
    } catch {
        return FALLBACK_RESPONSE;
    }
}

// --- 1. Constants & Types ---
const STATES = {
    ONBOARDING_SECTOR: "onboarding_sector",
    ONBOARDING_SPECIALIZATION: "onboarding_specialization",
    ONBOARDING_PROFILE: "onboarding_profile",
    ONBOARDING_PREFERENCE: "onboarding_preference",
    ROADMAP_GENERATION: "roadmap_generation",
    ACTIVE_LEARNING: "active_learning"
};

const INTENTS = [
    "choose_sector",
    "choose_specialization",
    "provide_profile",
    "provide_preference",
    "greeting"
];

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        message: { type: "string" },
        suggestions: { type: "array", items: { type: "string" } },
        action: { type: "string", enum: ["none", "generate_plan", "enroll", "redirect"] },
        redirect_to: { type: "string", nullable: true },
        collected_data: {
            type: "object",
            properties: {
                goal: { type: "string", nullable: true },
                specialization: { type: "string", nullable: true },
                level: { type: "string", nullable: true },
                weekly_hours: { type: "number", nullable: true }
            },
            nullable: true
        }
    },
    required: ["message", "suggestions", "action", "redirect_to"]
};

// --- 2. Orchestrator Functions ---

/**
 * Classify user intent with high confidence
 */
async function classifyIntent(openai: OpenAI, userInput: string): Promise<{ intent: string, confidence: number }> {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
            role: "system",
            content: `Classify the user intent for a learning platform chatbot. 
            Possible intents: ${INTENTS.join(", ")}.
            Return JSON: { "intent": "string", "confidence": number }`
        }, {
            role: "user",
            content: userInput
        }],
        response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
}

/** Session record from DB used for state machine. */
interface ChatSessionState {
  currentState: string;
  userProfile?: Record<string, unknown>;
}

/**
 * Deterministic State Machine to decide next state and action.
 */
function determineNextAction(
  session: ChatSessionState,
  intent: string,
  confidence: number
): { nextState: string; action: string; requiresLLM: boolean } {
  const currentState = session.currentState;
  const profile = session.userProfile || {};

    if (confidence < 0.6 && intent !== "greeting") {
        return { nextState: currentState, action: "clarify", requiresLLM: true };
    }

    // Logic: If we have the data for the current state, move to the next logical state
    if (currentState === STATES.ONBOARDING_SECTOR && profile.sector) {
        return { nextState: STATES.ONBOARDING_SPECIALIZATION, action: "ask_specialization", requiresLLM: true };
    }
    if (currentState === STATES.ONBOARDING_SPECIALIZATION && profile.specialization) {
        return { nextState: STATES.ONBOARDING_PROFILE, action: "ask_profile", requiresLLM: true };
    }
    if (currentState === STATES.ONBOARDING_PROFILE && profile.experience && profile.weekly_hours) {
        return { nextState: STATES.ONBOARDING_PREFERENCE, action: "ask_preference", requiresLLM: true };
    }
    if (currentState === STATES.ONBOARDING_PREFERENCE && profile.preference) {
        return { nextState: STATES.ROADMAP_GENERATION, action: "generate_plan", requiresLLM: true };
    }

    // Fallback: stay in current state but ask again/provide info
    return { nextState: currentState, action: "continue", requiresLLM: true };
}

// Helper to sort courses by level: beginner → intermediate → advanced
const LEVEL_ORDER: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
const sortByLevel = <T extends { level: string | null }>(arr: T[]): T[] =>
    [...arr].sort((a, b) => (LEVEL_ORDER[a.level || 'beginner'] || 99) - (LEVEL_ORDER[b.level || 'beginner'] || 99));

// --- 3. Route Handlers ---

router.get("/ping", (_req, res) => res.json({ status: "alive" }));

router.get("/session", requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as RequestWithAuth).session.userId;
        const [session] = await db.select()
            .from(aiSessions)
            .where(and(eq(aiSessions.userId, userId), eq(aiSessions.status, "active")))
            .orderBy(desc(aiSessions.createdAt))
            .limit(1);

        if (!session) return res.json({ session: null, messages: [] });

        const msgs = await db.select()
            .from(aiMessages)
            .where(eq(aiMessages.sessionId, session.id))
            .orderBy(aiMessages.createdAt);

        res.json({ session, messages: msgs });
    } catch (error) {
        res.status(500).json({ message: "Error loading session" });
    }
});

router.post("/reset-session", requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as RequestWithAuth).session.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        await db.update(aiSessions)
            .set({ status: "completed" })
            .where(and(eq(aiSessions.userId, userId), eq(aiSessions.status, "active")));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Error resetting session" });
    }
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
    try {
        const { message: userMessage } = req.body as { message?: string };
        const userId = (req as RequestWithAuth).session.userId;
        if (!userId) return res.status(401).json({ message: "غير مصرح" });
        const openai = getOpenAI();
        const anthropic = getAnthropic();

        if ((!openai && !anthropic) || !userMessage) return res.status(400).json({ message: "Invalid request (Check API Keys)" });

        // 1. Session Setup
        let [session] = await db.select().from(aiSessions)
            .where(and(eq(aiSessions.userId, userId), eq(aiSessions.status, "active")))
            .orderBy(desc(aiSessions.createdAt)).limit(1);

        if (!session) {
            [session] = await db.insert(aiSessions).values({ userId, currentState: STATES.ONBOARDING_SECTOR }).returning();
        }

        await db.insert(aiMessages).values({ sessionId: session.id, role: "user", content: userMessage });

        // 2. LLM response based on current profile and message
        const currentProfile = session.userProfile || {};
        const currentState = session.currentState;

        const msgs = await db.select()
            .from(aiMessages)
            .where(eq(aiMessages.sessionId, session.id))
            .orderBy(aiMessages.createdAt);

        const systemPrompt = buildChatbotSystemPrompt(TAALLM_COURSES);

        let aiResponse: ChatbotAIResponse = FALLBACK_RESPONSE;
        let providerUsed: "openai" | "anthropic" = "openai";

        if (anthropic) {
            providerUsed = "anthropic";
            try {
                const completion = await anthropic.messages.create({
                    model: "claude-3-7-sonnet-latest",
                    max_tokens: 1024,
                    messages: [{ role: "user", content: `System: ${systemPrompt}\nUser: ${userMessage}` }],
                    system: "Output raw JSON only, no markdown or extra text. Valid JSON object with message, suggestions, action.",
                    temperature: 0.1,
                });
                const contentBlock = completion.content[0];
                const text = contentBlock && "text" in contentBlock ? contentBlock.text : "";
                aiResponse = parseAndValidateChatbotResponse(text);
            } catch (e) {
                console.error("[CHATBOT] Claude API error:", e);
                aiResponse = { ...FALLBACK_RESPONSE, message: "عذراً، حدث خطأ في فهم البيانات. هل يمكنك محاولة مرة أخرى؟" };
            }
        } else if (openai) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...msgs.map((m) => ({ role: m.role, content: m.content } as { role: "system" | "user" | "assistant"; content: string })),
                        { role: "user", content: userMessage },
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                });
                const content = completion.choices[0]?.message?.content;
                aiResponse = parseAndValidateChatbotResponse(content);
            } catch (e) {
                console.error("[CHATBOT] OpenAI API error:", e);
                aiResponse = { ...FALLBACK_RESPONSE, message: "عذراً، حدث خطأ في فهم البيانات. هل يمكنك محاولة مرة أخرى؟" };
            }
        }

        // 3. Update Profile & Sync
        const sessionProfile = (session.userProfile as Record<string, unknown>) || {};
        const collected = aiResponse.collected_data || {};
        const updatedProfile = { ...sessionProfile, ...collected };

        // 4. Determine Next State based on NEW data
        let nextState = currentState;
        if (updatedProfile.sector && currentState === STATES.ONBOARDING_SECTOR) nextState = STATES.ONBOARDING_SPECIALIZATION;
        if (updatedProfile.specialization && currentState === STATES.ONBOARDING_SPECIALIZATION) nextState = STATES.ONBOARDING_PROFILE;
        if (updatedProfile.experience && updatedProfile.weekly_hours && currentState === STATES.ONBOARDING_PROFILE) nextState = STATES.ROADMAP_GENERATION;
        if (aiResponse.action === "redirect") nextState = STATES.ACTIVE_LEARNING;

        // 5. Save everything to DB
        await db.update(aiSessions)
            .set({
                currentState: nextState,
                userProfile: updatedProfile,
                updatedAt: new Date(),
            })
            .where(eq(aiSessions.id, session.id));

        // Sync to Students table
        try {
            const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (user) {
                const sector = updatedProfile.sector as string | undefined;
                const specialization = updatedProfile.specialization as string | undefined;
                const experience = updatedProfile.experience as string | undefined;
                const weekly_hours = updatedProfile.weekly_hours as number | undefined;
                const studentData = {
                    userId: user.id,
                    name: user.fullName,
                    email: user.email,
                    interests: [sector, specialization].filter(Boolean),
                    notes: experience && weekly_hours != null ? `الخبرة: ${experience}, ساعات: ${weekly_hours}` : null,
                    updatedAt: new Date(),
                };
                await db.insert(students).values(studentData).onConflictDoUpdate({ target: students.userId, set: studentData });
            }
        } catch (err) {
            console.error("[CHATBOT] Sync error:", err);
        }

        await db.insert(aiMessages).values({
            sessionId: session.id,
            role: "assistant",
            content: JSON.stringify(aiResponse),
            metadata: { state: nextState },
        });

        res.json({
            ...aiResponse,
            state: nextState,
            provider: providerUsed,
            step: [STATES.ONBOARDING_SECTOR, STATES.ONBOARDING_SPECIALIZATION, STATES.ONBOARDING_PROFILE, STATES.ONBOARDING_PREFERENCE, STATES.ROADMAP_GENERATION].indexOf(nextState) + 1
        });

    } catch (error) {
        console.error("Chatbot loop error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
