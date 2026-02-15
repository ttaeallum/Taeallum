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
            You are an expert academic advisor for Taeallum (تعلم), an Arabic e-learning platform.
            Your task is to build a "Zero to Hero" roadmap for the student based on their profile.
            
            Student Profile:
            ${JSON.stringify(profile, null, 2)}
            
            Tier: ${planTier}
            
            AVAILABLE COURSES (Use ONLY these courses to build the plan):
            ${courseListString}
            
            Requirements:
            - The plan MUST be in Arabic.
            - Based on the student's goal (Web Dev, AI, Design, or any other field), build a logical "Zero to Hero" path from basics to advanced using the AVAILABLE COURSES.
            - If a necessary course for a "Hero" level is missing from the catalog, you can suggest "External Practice" but prioritize the catalog items.
            - Include a list of selected courses from our catalog with their actual IDs.
            - Include a weekly schedule and milestones.
            - Plan should be highly professional and encouraging.
            - Return ONLY valid JSON matching the StudyPlan interface.
            
            StudyPlan Interface Structure:
            {
                "title": "...",
                "description": "...",
                "duration": "...",
                "totalHours": number,
                "difficulty": "beginner" | "intermediate" | "advanced" | "mixed",
                "courses": [{"id": "...", "title": "...", "description": "...", "duration": "...", "hours": number, "level": "...", "topics": [...], "projects": [...], "order": number, "startWeek": number, "endWeek": number}],
                "weeklySchedule": [{"week": number, "focus": "...", "courses": [...], "hours": number, "topics": [...], "deliverables": [...], "checkpoints": [...]}],
                "milestones": [{"week": number, "title": "...", "description": "...", "deliverables": [...], "skills": [...]}],
                "resources": {"courses": [...], "tools": [...], "communities": [...]},
                "recommendations": {"nextSteps": [...], "tips": [...], "warnings": [...]}
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
