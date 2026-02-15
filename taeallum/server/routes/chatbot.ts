import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { requireAuth } from "./auth";
import { db } from "../db";
import { aiSessions, subscriptions, users, courses } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Helper to get OpenAI instance (Resilient to env loading order)
const getOpenAI = () => {
    const key = process.env.OPENAI || process.env.OPENAI_API_KEY;
    if (!key) return null;
    return new OpenAI({ apiKey: key });
};

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

        const openai = getOpenAI();
        if (!openai) {
            console.error("[CHATBOT ERROR] OpenAI Key not found in process.env");
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
                suggestion: "يرجى الاشتراك في خطة المساعد الذكي (10$ شهرياً) لتتمكن من استخدام المساعد الذكي."
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
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `أنت "المساعد الذكي"، الخبير التعليمي والمرشد الأكاديمي لمنصة "تعلم" (Taeallum).
                    مهمتك هي مساعدة الطلاب في رحلتهم التعليمية بكل احترافية وودية.
                    
                    سياق المستخدم:
                    - خطة الاشتراك: ${plan}.
                    - الدورات المتاحة حالياً في المنصة:
                    ${courseKnowledge}
                    
                    إرشادات الإجابة:
                    1. كن مشجعاً وملهماً دائماً.
                    2. إذا سأل الطالب عن البرمجة أو التقنية أو التصميم، قدم إجابات دقيقة ومبسطة.
                    3. حاول دائماً ربط الإجابات بالكورسات المتوفرة في المنصة إذا كانت ذات صلة.
                    4. تحدث باللغة العربية الفصحى البسيطة والمحببة للطلاب.`
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
                message: "عذراً، يبدو أن رصيد الـ API الخاص بـ OpenAI قد نفد. يرجى شحن الرصيد من لوحة تحكم OpenAI ليعود المساعد الذكي للعمل."
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
