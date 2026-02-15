import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { requireAuth } from "./auth";
import { db } from "../db";
import { aiSessions, subscriptions, users, courses } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

const openaiKey = process.env.OPENAI || process.env.OPENAI_API_KEY;
const openai = openaiKey
    ? new OpenAI({ apiKey: openaiKey })
    : null;

// Helper to get limit based on plan
// Helper to get limit based on plan
const getLimit = (plan: string) => {
    switch (plan) {
        case "ultra": return Infinity;
        case "pro": return Infinity; // Unlimited for Pro ($10 plan)
        case "personal": return 20;
        default: return 0; // No free messages allowed (Paid only)
    }
};

router.post("/", requireAuth, async (req: Request, res: Response) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.session.userId;

        if (!openai) {
            return res.status(400).json({ message: "OpenAI is not configured" });
        }

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        // 1. Get User's Subscription
        const [userRecord] = await db.select().from(users).where(eq(users.id, userId!)).limit(1);
        const adminEmail = (process.env.ADMIN_EMAIL || "hamzaali200410@gmail.com").toLowerCase();
        // Check both email match OR role === 'admin'
        const isAdmin = userRecord?.email.toLowerCase() === adminEmail || userRecord?.role === "admin";

        const [subscription] = await db.select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId!))
            .orderBy(desc(subscriptions.createdAt))
            .limit(1);

        const planRaw = subscription?.status === "active" ? subscription.plan : "free";
        const plan = isAdmin ? "ultra" : planRaw;
        const limit = isAdmin ? Infinity : getLimit(plan);

        // Block if limit is 0 (Non-subscriber)
        if (limit === 0) {
            return res.status(403).json({
                message: "عذراً، هذه الخدمة متاحة للمشتركين فقط.",
                upgradeRequired: true,
                suggestion: "يرجى الاشتراك في خطة حمزة الذكي (10$ شهرياً) لتتمكن من استخدام المساعد الذكي."
            });
        }

        // 2. Fetch Courses Knowledge
        const catalog = await db.query.courses.findMany({
            where: eq(courses.isPublished, true),
            with: { category: true }
        });

        const courseKnowledge = catalog.map(c =>
            `- ${c.title} (${c.level}): ${c.aiDescription || c.description}`
        ).join("\n");

        // 3. Check/Create AI Session and count messages
        let session;
        if (sessionId) {
            [session] = await db.select().from(aiSessions).where(eq(aiSessions.id, sessionId)).limit(1);
        }

        if (!session) {
            [session] = await db.insert(aiSessions).values({
                userId: userId!,
                subscriptionId: subscription?.id || null,
                sessionType: "chat",
            }).returning();
        }

        if (session.messagesCount >= limit) {
            return res.status(403).json({
                message: `لقد وصلت إلى الحد المسموح به لخطة ${plan}.`,
                upgradeRequired: true,
                suggestion: "قم بالترقية إلى AI Ultra for Business للحصول على أعلى معدلات استخدام (Highest Rate Limits) وبدون قيود."
            });
        }

        // 4. Call OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `أنت مساعد ذكي لمنصة 'تعلم' (Taeallum) اسمك "حمزة". 
                    خطة المستخدم الحالية: ${plan}.
                    استخدم المعلومات التالية عن الكورسات المتاحة لترشيح الأنسب للطالب إذا طلب ذلك:
                    ${courseKnowledge}
                    
                    ساعد الطلاب في الإجابة على أسئلتهم حول البرمجة، التقنية، والتصميم بأسلوب ودود وباللغة العربية.`
                },
                { role: "user", content: message }
            ],
        });

        const reply = response.choices[0].message.content;

        // 4. Update message count
        await db.update(aiSessions)
            .set({
                messagesCount: session.messagesCount + 1,
                updatedAt: new Date()
            })
            .where(eq(aiSessions.id, session.id));

        res.json({
            reply,
            sessionId: session.id,
            messagesRemaining: limit === Infinity ? "unlimited" : limit - (session.messagesCount + 1)
        });
    } catch (error: any) {
        console.error("OpenAI Error:", error);

        // Handle specific OpenAI errors
        if (error?.status === 429 || error?.code === "insufficient_quota") {
            return res.status(429).json({
                message: "عذراً، يبدو أن رصيد الـ API الخاص بـ OpenAI قد نفد. يرجى شحن الرصيد من لوحة تحكم OpenAI ليعود حمزة للعمل."
            });
        }

        // Return specific error details for debugging
        const errorDetail = error?.message || String(error);
        res.status(500).json({
            message: "حدث خطأ أثناء التواصل مع المساعد الذكي",
            detail: errorDetail
        });
    }
});

export default router;
