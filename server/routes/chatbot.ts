import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { requireAuth } from "./auth";
import { db } from "../db";
import { aiSessions, aiMessages, users, studyPlans } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getConfig } from "../config";

const router = Router();

const getOpenAI = () => {
    try {
        const key = getConfig("OPENAI_API_KEY");
        if (!key) return null;
        return new OpenAI({ apiKey: key });
    } catch (err) {
        return null;
    }
};

// --- 1. Constants & Types ---
const STATES = {
    ONBOARDING_GOAL: "onboarding_goal",
    ONBOARDING_BACKGROUND: "onboarding_background",
    ONBOARDING_LEVEL: "onboarding_level",
    ONBOARDING_TIME: "onboarding_time_commitment",
    ROADMAP_GENERATION: "roadmap_generation",
    ACTIVE_LEARNING: "active_learning",
    WEEKLY_REVIEW: "weekly_review",
    ADAPTIVE_ADJUSTMENT: "adaptive_adjustment"
};

const INTENTS = [
    "choose_sector",
    "choose_specialization",
    "provide_level",
    "provide_time",
    "weekly_update",
    "off_topic",
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

    if (confidence < 0.6 && intent !== "greeting") {
        return { nextState: currentState, action: "clarify", requiresLLM: true };
    }

    switch (currentState) {
        case STATES.ONBOARDING_GOAL:
            if (intent === "choose_sector" || intent === "choose_specialization") {
                return { nextState: STATES.ONBOARDING_BACKGROUND, action: "ask_background", requiresLLM: true };
            }
            break;
        case STATES.ONBOARDING_BACKGROUND:
            return { nextState: STATES.ONBOARDING_LEVEL, action: "ask_level", requiresLLM: true };
        case STATES.ONBOARDING_LEVEL:
            return { nextState: STATES.ONBOARDING_TIME, action: "ask_time", requiresLLM: true };
        case STATES.ONBOARDING_TIME:
            return { nextState: STATES.ROADMAP_GENERATION, action: "generate_plan", requiresLLM: true };
        case STATES.ROADMAP_GENERATION:
            return { nextState: STATES.ACTIVE_LEARNING, action: "redirect", requiresLLM: false, redirect_to: "/tracks" };
        case STATES.ACTIVE_LEARNING:
            // Check if it's been 7 days since last update (simplified check)
            const lastUpdate = new Date(session.updatedAt);
            const now = new Date();
            const diffDays = Math.ceil((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays >= 7) {
                return { nextState: STATES.WEEKLY_REVIEW, action: "review_progress", requiresLLM: true };
            }

            if (intent === "weekly_update") {
                return { nextState: STATES.WEEKLY_REVIEW, action: "review_progress", requiresLLM: true };
            }
            return { nextState: STATES.ACTIVE_LEARNING, action: "chat", requiresLLM: true };
        case STATES.WEEKLY_REVIEW:
            return { nextState: STATES.ADAPTIVE_ADJUSTMENT, action: "propose_adjustment", requiresLLM: true };
        case STATES.ADAPTIVE_ADJUSTMENT:
            return { nextState: STATES.ACTIVE_LEARNING, action: "continue", requiresLLM: true };
        default:
            return { nextState: STATES.ONBOARDING_GOAL, action: "start", requiresLLM: true };
    }

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

        if (!openai || !userMessage) return res.status(400).json({ message: "Invalid request" });

        // 1. Session Setup
        let [session] = await db.select().from(aiSessions)
            .where(and(eq(aiSessions.userId, userId!), eq(aiSessions.status, "active")))
            .orderBy(desc(aiSessions.createdAt)).limit(1);

        if (!session) {
            [session] = await db.insert(aiSessions).values({ userId: userId!, currentState: STATES.ONBOARDING_GOAL }).returning();
        }

        await db.insert(aiMessages).values({ sessionId: session.id, role: "user", content: userMessage });

        // 2. Intent & Decision
        const { intent, confidence } = await classifyIntent(openai, userMessage);
        const decision = determineNextAction(session, intent, confidence);

        // 3. LLM Extraction/Response
        let aiResponse: {
            message: string,
            suggestions: string[],
            action: string,
            redirect_to: string | null,
            collected_data: any
        } = {
            message: "أنا معك، كيف يمكنني مساعدتك؟",
            suggestions: [],
            action: "none",
            redirect_to: null,
            collected_data: null
        };

        if (decision.requiresLLM) {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a professional Arabic AI Mentor for the taallm (تعلم) platform. Respond ONLY in structured JSON. Follow the schema strictly. Current State: " + decision.nextState },
                    { role: "user", content: userMessage }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2,
                top_p: 0.8
            });

            try {
                aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
            } catch (e) {
                console.error("JSON Parse Error:", e);
            }
        }

        // 4. Action Execution
        const action = aiResponse.action || decision.action;
        if (action === "generate_plan") {
            // Placeholder: Link to actual study plans logic if needed
            // For now, we'll mark as redirect to tracks once data is collected
            aiResponse.action = "redirect";
            aiResponse.redirect_to = "/tracks";
        }

        // 5. Update State & DB
        await db.update(aiSessions)
            .set({
                currentState: decision.nextState as any,
                userProfile: { ...(session.userProfile as any || {}), ...(aiResponse.collected_data || {}) } as any
            })
            .where(eq(aiSessions.id, session.id));

        await db.insert(aiMessages).values({
            sessionId: session.id,
            role: "assistant",
            content: JSON.stringify(aiResponse),
            metadata: { intent, state: decision.nextState } as any
        });

        res.json({
            ...aiResponse,
            state: decision.nextState,
            step: Object.keys(STATES).indexOf(Object.keys(STATES).find(k => STATES[k as keyof typeof STATES] === decision.nextState) || "ONBOARDING_GOAL") + 1
        });

    } catch (error) {
        console.error("Chatbot loop error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
