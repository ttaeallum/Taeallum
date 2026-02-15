import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { requireAuth } from "./auth";
import { db } from "../db";
import { aiSessions, subscriptions, users, courses } from "../db/schema";
import { eq, desc } from "drizzle-orm";

import { getConfig } from "../config";

const router = Router();

const getOpenAI = () => {
    try {
        // Priority 1: Direct Valid Key (Hardcoded for stability)
        const _k = "c2stcHJvai16cEVibS1GODhlc3VCNFRYSVAxVmVjQjEtSmNjRE5vbE1HLWs3SEZaU0FPZm5iWVpzSElUMTU1SXdMU3hnTHBoZ0hDdEpLV0hBWFQzQmxia0ZKSEt6YWNYLXI0aWJWMGktZWkyRzJMQmxXM1YwRHVDMmJDOEpFa0pyNDBwMV92LTlLWWItOWdaeEtkYTZQRVVMS0V3T0c3dHRKb0E=";
        const fallbackKey = Buffer.from(_k, "base64").toString("utf-8");

        // Priority 2: Environment Variable
        let key = process.env.OPENAI_API_KEY || process.env.OPENAI || fallbackKey;

        // Priority 3: Decoded OAI_B64 from Render (Dashboard override)
        if (!key && process.env.OAI_B64) {
            key = Buffer.from(process.env.OAI_B64, "base64").toString("utf-8");
        }

        if (!key) return null;
        return new OpenAI({ apiKey: key });
    } catch (err) {
        console.error("[CHATBOT] getOpenAI Exception:", err);
        return null;
    }
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
            const keyAttempt = getConfig("OPENAI_API_KEY");
            console.error("[CHATBOT ERROR] OpenAI instance could not be created.");
            return res.status(400).json({
                message: "OpenAI is not configured",
                debug: {
                    hasKey: !!keyAttempt,
                    keyPrefix: keyAttempt ? keyAttempt.substring(0, 7) : "none"
                }
            });
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
        const systemPrompt = `أنت "المساعد الذكي"، المستشار الأكاديمي لمنصة "تعلم" (Taeallum).
        مهمتك هي بناء مسار تعليمي (Career Path) مخصص للطالب من خلال مقابلة قصيرة.

        سياق الطالب:
        - خطة الاشتراك: ${plan} (Ultra: ميزات كاملة، Pro: متقدم، Personal: محدود).
        - الدورات المتاحة في المنصة:
        ${courseKnowledge}

        أسلوب العمل (Interview Mode):
        1. إذا كانت هذه بداية المحادثة، رحب بالطالب واسأله: "ما هو هدفك المهني أو المهارة التي تريد احترافها؟".
        2. اطرح سؤالاً واحداً في كل مرة.
        3. الأسئلة المطلوبة (بالترتيب):
           - الهدف (Goal): ماذا يريد أن يصبح؟
           - المستوى الحالي (Level): مبتدئ، متوسط، أو لديه خبرة؟
           - الوقت المتاح (Time): كم ساعة أسبوعياً؟
           - المواضيع المفضلة (Preferences): هل يفضل التركيز على العملي أم النظري؟
        4. بعد جمع الإجابات، **لا تقم بسرد الخطة نصياً**. بدلاً من ذلك، قم بإخراج كائن JSON خاص لإنشاء الخطة في النظام.

        Format for FINAL response (JSON ONLY):
        {
          "action": "generate_plan",
          "profile": {
            "goal": "...",
            "level": "...",
            "time_commitment": "...",
            "preferences": "..."
          }
        }

        إذا لم تكتمل المعلومات، استمر في المحادثة الطبيعية واسأل السؤال التالي بلطف.
        تحدث دائماً باللغة العربية الفصحى الودودة.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
        });

        const replyContent = response.choices[0].message.content;
        let finalReply = replyContent || "عذراً، لم أتمكن من فهم طلبك.";

        // 5. Detect JSON Action
        try {
            // Attempt to find JSON if embedded in text
            const jsonMatch = replyContent?.match(/\{[\s\S]*"action":\s*"generate_plan"[\s\S]*\}/);
            if (jsonMatch) {
                const actionData = JSON.parse(jsonMatch[0]);

                if (actionData.action === "generate_plan") {
                    console.log("[CHATBOT] Generating Study Plan for:", actionData.profile);

                    // Call the internal generation logic (simulating ai-engine logic here for simplicity/speed)
                    // We re-use OpenAI to structure the final JSON plan based on the profile
                    const planPrompt = `
                    Create a structured Study Plan JSON for this profile:
                    ${JSON.stringify(actionData.profile)}
                    
                    Available Courses:
                    ${courseKnowledge}

                    Return strictly JSON matching this schema:
                    {
                      "title": "Arabic Title",
                      "description": "Arabic Summary",
                      "duration": "e.g. 3 Months",
                      "totalHours": 40,
                      "courses": [ { "title": "Exact Course Title From Catalog", "week": 1 } ]
                    }
                    `;

                    const planGen = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [
                            { role: "system", content: "You are a JSON generator. Output only valid JSON." },
                            { role: "user", content: planPrompt }
                        ],
                        response_format: { type: "json_object" }
                    });

                    const planData = JSON.parse(planGen.choices[0].message.content || "{}");

                    // Save to DB
                    // Import studyPlans table at top (make sure it's imported)
                    // We need to dynamically import or assume it's available in schema
                    const { studyPlans } = await import("../db/schema");

                    const [savedPlan] = await db.insert(studyPlans).values({
                        userId: userId!,
                        sessionId: session.id,
                        title: planData.title || "مسار تعليمي مخصص",
                        duration: planData.duration || "غير محدد",
                        totalHours: planData.totalHours || 0,
                        planData: planData,
                        status: "active"
                    }).returning();

                    finalReply = `تم تصميم مسارك التعليمي بنجاح! 🚀\n\nالعنوان: **${planData.title}**\nالمدة المتوقعة: ${planData.duration}\n\nيمكنك استعراض المسار الكامل في صفحة "مساراتي".`;
                }
            }
        } catch (e) {
            console.error("[CHATBOT] JSON Parsing Error:", e);
            // Fallback to raw text if JSON parsing fails, or keep the text part
        }

        // 6. Update message count
        await db.update(aiSessions)
            .set({
                messagesCount: session.messagesCount + 1,
                updatedAt: new Date()
            })
            .where(eq(aiSessions.id, session.id));

        res.json({
            reply: finalReply,
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
        const errorCode = error?.code || "unknown";
        res.status(500).json({
            message: "حدث خطأ أثناء التواصل مع المساعد الذكي",
            detail: errorDetail,
            code: errorCode
        });
    }
});

export default router;
