import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { requireAuth } from "./auth";
import { db } from "../db";
import * as schema from "../db/schema";
import { aiSessions, studyPlans, subscriptions, users } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

const openaiKey = process.env.OPENAI || process.env.OPENAI_API_KEY;
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

router.get("/user-plans", requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId;
        const plans = await db.query.studyPlans.findMany({
            where: eq(schema.studyPlans.userId, userId!),
            orderBy: [desc(schema.studyPlans.createdAt)]
        });
        res.json(plans);
    } catch (error) {
        console.error("Fetch plans error:", error);
        res.status(500).json({ message: "Failed to fetch your learning paths" });
    }
});

router.post("/generate-plan", requireAuth, async (req: Request, res: Response) => {
    try {
        const { profile } = req.body;
        const userId = req.session.userId;

        if (!openai) {
            return res.status(400).json({ message: "OpenAI is not configured" });
        }

        if (!profile) {
            return res.status(400).json({ message: "Profile data is required" });
        }

        // 1. Get Actual Courses for the AI to choose from
        const catalog = await db.query.courses.findMany({
            where: eq(schema.courses.isPublished, true),
            with: { category: true }
        });

        const courseListString = catalog.map(c =>
            `- ID: ${c.id}, Title: ${c.title}, Category: ${c.category?.name}, Desc: ${c.description}, AI_Reference: ${c.aiDescription || 'No special instructions'}, Difficulty: ${c.level}`
        ).join("\n");

        // 2. Check user tier for plan complexity
        const [userRecord] = await db.select().from(users).where(eq(users.id, userId!)).limit(1);
        const adminEmail = (process.env.ADMIN_EMAIL || "hamzaali200410@gmail.com").toLowerCase();
        const isAdmin = userRecord?.email.toLowerCase() === adminEmail;

        const [subscription] = await db.select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId!))
            .orderBy(desc(subscriptions.createdAt))
            .limit(1);

        // Unified check: must be active or admin
        const isSubscribed = subscription?.status === "active" || isAdmin;

        if (!isSubscribed) {
            return res.status(403).json({
                message: "عذراً، هذه الخدمة متاحة للمشتركين فقط.",
                upgradeRequired: true,
                suggestion: "يرجى الاشتراك في خطة المساعد الذكي (10$ شهرياً) للحصول على خطة دراسية مخصصة."
            });
        }

        const planTier = isAdmin ? "ultra" : "pro";

        // 3. Prepare Prompt
        const prompt = `
            You are the "Smart Assistant" (المساعد الذكي) for Taeallum (تعلم), an elite Arabic e-learning platform.
            Your mission is to construct a highly personalized "Zero to Hero" learning roadmap for a student.
            
            Student Profile (JSON):
            ${JSON.stringify(profile, null, 2)}
            
            User Tier: ${planTier}
            
            CATALOG OF AVAILABLE COURSES (You MUST use these for the core roadmap):
            ${courseListString}
            
            GUIDELINES FOR ROADMAP GENERATION:
            1. LANGUAGE: The entire response (titles, descriptions, tips) MUST be in professional Arabic.
            2. INTELLIGENCE: Use the 'AI_Reference' and 'Desc' fields from the catalog to understand the technical depth of each course.
            3. LOGIC: Order courses from fundamental (Basics) to professional (Production-ready). 
            4. ACCURACY: Do not hallucinate course IDs. Use only the provided IDs from the catalog.
            5. SUPPLEMENT: If the catalog lacks a crucial step for the student's specific goal, you may add "External Practice" milestones, but always anchor them around our catalog courses.
            6. FORMAT: Return ONLY a valid JSON object matching the StudyPlan structure.
            
            StudyPlan Structure:
            {
                "title": "Smart Title in Arabic",
                "description": "Deeply personalized summary of how this plan helps the student reach their goal",
                "duration": "e.g., 6 أشهر",
                "totalHours": number,
                "difficulty": "beginner" | "intermediate" | "advanced" | "mixed",
                "courses": [
                    {
                        "id": "match actual catalog ID",
                        "title": "Arabic Title",
                        "description": "Why this specific course is in the plan",
                        "duration": "...",
                        "hours": number,
                        "level": "...",
                        "topics": ["Detail 1", "Detail 2"],
                        "projects": ["Mini project using this course"],
                        "order": 1,
                        "startWeek": 1,
                        "endWeek": 4
                    }
                ],
                "weeklySchedule": [
                    {
                        "week": number,
                        "focus": "Topic of the week",
                        "courses": ["id1", "id2"],
                        "hours": number,
                        "topics": ["Arabic details"],
                        "deliverables": ["What to build this week"],
                        "checkpoints": ["Validation steps"]
                    }
                ],
                "milestones": [
                    {
                        "week": number,
                        "title": "Achievement name",
                        "description": "Description of the milestone reached",
                        "deliverables": ["Project/Skill"],
                        "skills": ["Arabic keywords"]
                    }
                ],
                "resources": {
                    "courses": ["Resource links/names"],
                    "tools": ["Needed software"],
                    "communities": ["Where to ask help"]
                },
                "recommendations": {
                    "nextSteps": ["What to do after this plan"],
                    "tips": ["Learning hacks"],
                    "warnings": ["Common pitfalls"]
                }
            }
        `;

        // 4. Call OpenAI with GPT-4o
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a professional study plan generator for Taeallum platform. Output only JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const generatedPlan = JSON.parse(completion.choices[0].message.content || "{}");

        // 5. Save to Database
        const [session] = await db.insert(aiSessions).values({
            userId: userId!,
            subscriptionId: subscription?.id || null,
            sessionType: "onboarding",
            userProfile: profile,
            generatedPlan: generatedPlan
        }).returning();

        const [savedPlan] = await db.insert(studyPlans).values({
            userId: userId!,
            sessionId: session.id,
            title: generatedPlan.title || "خطة دراسية مخصصة",
            duration: generatedPlan.duration || "غير محدد",
            totalHours: generatedPlan.totalHours || 0,
            planData: generatedPlan,
            status: "active"
        }).returning();

        res.json({ plan: generatedPlan, sessionId: session.id, planId: savedPlan.id });
    } catch (error: any) {
        console.error("Plan Generation Error:", error);

        // Handle specific OpenAI errors
        if (error?.status === 429 || error?.code === "insufficient_quota") {
            return res.status(429).json({
                message: "عذراً، رصيد الـ API الخاص بـ OpenAI قد نفد. يرجى شحن الرصيد ليعود المساعد الذكي للعمل."
            });
        }

        res.status(500).json({ message: "حدث خطأ أثناء إنشاء الخطة الدراسية" });
    }
});

export default router;
