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

const getOpenAI = () => {
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

const getAnthropic = () => {
    try {
        const key = getConfig("ANTHROPIC_API_KEY");
        if (!key) return null;
        return new Anthropic({ apiKey: key });
    } catch (err) {
        return null;
    }
};

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

/**
 * Deterministic State Machine to decide next state and action
 */
function determineNextAction(session: any, intent: string, confidence: number) {
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
        const userId = (req as any).session.userId;
        const [session] = await db.select()
            .from(aiSessions)
            .where(and(eq(aiSessions.userId, userId!), eq(aiSessions.status, "active")))
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
        await db.update(aiSessions)
            .set({ status: "completed" })
            .where(and(eq(aiSessions.userId, (req as any).session.userId!), eq(aiSessions.status, "active")));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Error resetting session" });
    }
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
    try {
        const { message: userMessage } = req.body;
        const userId = (req as any).session.userId;
        const openai = getOpenAI();
        const anthropic = getAnthropic();

        if ((!openai && !anthropic) || !userMessage) return res.status(400).json({ message: "Invalid request (Check API Keys)" });

        // 1. Session Setup
        let [session] = await db.select().from(aiSessions)
            .where(and(eq(aiSessions.userId, userId!), eq(aiSessions.status, "active")))
            .orderBy(desc(aiSessions.createdAt)).limit(1);

        if (!session) {
            [session] = await db.insert(aiSessions).values({ userId: userId!, currentState: STATES.ONBOARDING_SECTOR }).returning();
        }

        await db.insert(aiMessages).values({ sessionId: session.id, role: "user", content: userMessage });

        // 2. LLM response based on current profile and message
        const currentProfile = session.userProfile || {};
        const currentState = session.currentState;

        const msgs = await db.select()
            .from(aiMessages)
            .where(eq(aiMessages.sessionId, session.id))
            .orderBy(aiMessages.createdAt);

        const systemPrompt = `
أنت "تعلّم" — مستشار تعليمي ذكي على منصة تعلّم.
لست chatbot عادي — أنت مدرس شخصي يفكر ويحلل ويتكيف مع كل طالب.
هدفك الوحيد: توصيل الطالب لهدفه بأقصر طريق ممكن.

━━━━━━━━━━━━━━━━━━━━━━━━
# مبادئك الأساسية
━━━━━━━━━━━━━━━━━━━━━━━━
1. لا تعطي الطالب ما لا يحتاجه أبداً
2. لا تحفظ مسارات جاهزة — فكّر وحلّل كل طالب من الصفر
3. كل طالب فريد — خطته فريدة
4. لا تسأل عن معلومة قدّمها الطالب مسبقاً
5. كن مختصراً وواضحاً — لا تطول بدون فائدة

━━━━━━━━━━━━━━━━━━━━━━━━
# الكورسات المتاحة على تعلّم فقط
━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(TAALLM_COURSES, null, 2)}

⚠️ لا تقترح أي كورس خارج هاي القائمة أبداً.

━━━━━━━━━━━━━━━━━━━━━━━━
# مرحلة الفهم — اسأل قبل ما تبني
━━━━━━━━━━━━━━━━━━━━━━━━
قبل أي خطة، لازم تعرف:
1. شو هدفه الدقيق؟ (مش "تقنية" — بالضبط شو بده يصير)
2. شو مستواه الحالي؟ (مبتدئ / عنده أساس / متوسط)
3. شو درس سابقاً؟ (حتى ما تكرر مواد خلصها)
4. كم ساعة بالأسبوع متاحة عنده؟

━━━━━━━━━━━━━━━━━━━━━━━━
# منطق بناء المسار (3 طبقات)
━━━━━━━━━━━━━━━━━━━━━━━━
بعد ما تفهم الطالب، فكّر هيك:

الطبقة 1 — Core (للكل):
  حدد بالضبط شو من IT Core يحتاجه
  مثال:
  ✅ مطور ويب → يحتاج: Programming, OOP, Data Structures, Databases
  ❌ مطور ويب → لا يحتاج: Linear Algebra, Numerical Analysis

الطبقة 2 — Shared (للتخصص الرئيسي):
  المواد المشتركة بين التخصصات المتقاربة

الطبقة 3 — Specialized (للهدف الدقيق):
  فقط المواد الخاصة بهدفه بالضبط

━━━━━━━━━━━━━━━━━━━━━━━━
# قواعد المواد المشتركة (ذكاء حقيقي)
━━━━━━━━━━━━━━━━━━━━━━━━
إذا الطالب درس مادة في مسار وبعدين أضاف تخصص ثاني:
→ لا تعد نفس المادة — ابنِ من حيث انتهى

مثال:
  درس Python للويب ✅
  بدأ Data Science → تخطى Python مباشرة ✅

━━━━━━━━━━━━━━━━━━━━━━━━
# قواعد المتابعة
━━━━━━━━━━━━━━━━━━━━━━━━
- بعد كل كورس → امتحان قصير
- نجح (70%+) → الكورس الجاي
- رسب → حدد وين الضعف بالضبط، أعد المادة المحددة فقط
- تأخر أكثر من أسبوع → ذكّره وشجعه
- غيّر هدفه → أعد بناء الخطة من النقطة الحالية

━━━━━━━━━━━━━━━━━━━━━━━━
# صيغة الرد (JSON فقط)
━━━━━━━━━━━━━━━━━━━━━━━━
{
  "message": "نص الرد — ودود ومختصر",
  "suggestions": ["خيار 1", "خيار 2", "خيار 3"],
  "action": "none | show_plan | redirect",
  "collected_data": {
    "goal": "الهدف الدقيق للطالب",
    "level": "beginner | intermediate | advanced",
    "completed_courses": [],
    "weekly_hours": 0
  },
  "study_plan": {
    "total_months": 0,
    "phases": [
      {
        "phase": 1,
        "title": "اسم المرحلة",
        "duration_months": 0,
        "courses": ["كورس 1", "كورس 2"],
        "reason": "ليش هاي المرحلة"
      }
    ]
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━
# شخصيتك
━━━━━━━━━━━━━━━━━━━━━━━━
- تحكي بالعربي بشكل طبيعي وودود
- مشجع دائماً لكن صادق
- مباشر وواضح — لا تطول بدون فائدة
- تعامل مع الطالب كإنسان مش كرقم
- إذا الطالب يطلب مادة مش على تعلّم → قوله بصراحة

━━━━━━━━━━━━━━━━━━━━━━━━
# ممنوع أبداً
━━━━━━━━━━━━━━━━━━━━━━━━
❌ لا تقترح كورس مش على تعلّم
❌ لا تعطي مواد زيادة عن اللي يحتاجها
❌ لا تعطي نفس المسار لكل الطلاب
❌ لا تبدأ بالخطة قبل ما تفهم الطالب كامل
❌ لا تكرر سؤال أجاب عنه الطالب
❌ لا تكرر الترحيب في كل رسالة
`;

        let aiResponse: any = {};
        let providerUsed = "openai";

        if (anthropic) {
            providerUsed = "anthropic";
            const completion = await anthropic.messages.create({
                model: "claude-3-7-sonnet-latest",
                max_tokens: 1024,
                messages: [{ role: "user", content: `System: ${systemPrompt}\nUser: ${userMessage}` }],
                system: "Output raw JSON based on the prompt.",
                temperature: 0.1,
            });

            try {
                const content = (completion.content[0] as any).text;
                aiResponse = JSON.parse(content || "{}");
            } catch (e) {
                console.error("Claude Parse Error:", e);
            }
        } else if (openai) {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...msgs.map(m => ({ role: m.role as any, content: m.content })),
                    { role: "user", content: userMessage }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
            });
            try {
                aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
            } catch (e) {
                aiResponse = { message: "عذراً، حدث خطأ في فهم البيانات. هل يمكنك محاولة مرة أخرى؟", suggestions: [] };
            }
        }

        if (!aiResponse.message) {
            aiResponse = { message: "عذراً، حدث خطأ في معالجة الطلب. يرجى المحاولة لاحقاً.", suggestions: [] };
        }

        // 3. Update Profile & Sync
        const updatedProfile = { ...(session.userProfile as any || {}), ...(aiResponse.collected_data || {}) };

        // 4. Determine Next State based on NEW data
        let nextState = currentState;
        if (updatedProfile.sector && currentState === STATES.ONBOARDING_SECTOR) nextState = STATES.ONBOARDING_SPECIALIZATION;
        if (updatedProfile.specialization && currentState === STATES.ONBOARDING_SPECIALIZATION) nextState = STATES.ONBOARDING_PROFILE;
        if (updatedProfile.experience && updatedProfile.weekly_hours && currentState === STATES.ONBOARDING_PROFILE) nextState = STATES.ROADMAP_GENERATION;
        if (aiResponse.action === "redirect") nextState = STATES.ACTIVE_LEARNING;

        // 5. Save everything to DB
        await db.update(aiSessions)
            .set({
                currentState: nextState as any,
                userProfile: updatedProfile as any,
                updatedAt: new Date()
            })
            .where(eq(aiSessions.id, session.id));

        // Sync to Students table
        try {
            const [user] = await db.select().from(users).where(eq(users.id, userId!)).limit(1);
            if (user) {
                const studentData = {
                    userId: user.id,
                    name: user.fullName,
                    email: user.email,
                    interests: [updatedProfile.sector, updatedProfile.specialization].filter(Boolean),
                    notes: updatedProfile.experience ? `الخبرة: ${updatedProfile.experience}, ساعات: ${updatedProfile.weekly_hours}` : null,
                    updatedAt: new Date()
                };
                await db.insert(students).values(studentData as any).onConflictDoUpdate({ target: students.userId, set: studentData as any });
            }
        } catch (err) { console.error("Sync error:", err); }

        await db.insert(aiMessages).values({
            sessionId: session.id,
            role: "assistant",
            content: JSON.stringify(aiResponse), // Important: store full JSON for UI to parse suggestions
            metadata: { state: nextState } as any
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
