import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { requireAuth } from "./auth";
import { db } from "../db";
import { aiSessions, subscriptions, users, courses, enrollments, studyPlans } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";

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
        const { message: userMessage, sessionId } = req.body;
        const userId = req.session.userId;

        const openai = getOpenAI();
        if (!openai) {
            return res.status(500).json({ message: "OpenAI is not configured" });
        }

        if (!userMessage) {
            return res.status(400).json({ message: "Message is required" });
        }

        // 1. Initial Context Retrieval (Memory)
        const [userRecord] = await db.select().from(users).where(eq(users.id, userId!)).limit(1);
        const adminEmail = (process.env.ADMIN_EMAIL || "hamzaali200410@gmail.com").toLowerCase();
        const isAdmin = userRecord?.email.toLowerCase() === adminEmail || userRecord?.role === "admin";

        // Fetch user's enrollments and study plans for context
        const userEnrollments = await db.query.enrollments.findMany({
            where: eq(enrollments.userId, userId!),
            with: { course: true }
        });
        const userPlans = await db.query.studyPlans.findMany({
            where: eq(studyPlans.userId, userId!),
            limit: 3
        });

        const contextSummary = `
        Student Name: ${userRecord?.fullName}
        Registered: ${userRecord?.createdAt}
        Current Courses: ${(userEnrollments as any[]).map(e => e.course?.title).join(", ") || "None"}
        Existing Study Plans: ${userPlans.map(p => p.title).join(", ") || "None"}
        Preferences: ${JSON.stringify(userRecord?.preferences || {})}
        `;

        // 2. Define Tools (Actions)
        const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
            {
                type: "function",
                function: {
                    name: "search_platform_courses",
                    description: "Search for specific educational courses available on the Taeallum platform.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "Keywords to search in title or description" },
                            category: { type: "string", description: "Category slug (e.g. coding, business)" },
                            level: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
                        }
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "enroll_student",
                    description: "Actively enroll the student in a specific course. Only use this if the student explicitly agrees.",
                    parameters: {
                        type: "object",
                        properties: {
                            courseId: { type: "string", description: "UUID of the course" },
                            courseTitle: { type: "string", description: "Title of the course for logging" }
                        },
                        required: ["courseId", "courseTitle"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "set_learning_goals",
                    description: "Save long-term learning goals and milestones in the student's preferences (Memory).",
                    parameters: {
                        type: "object",
                        properties: {
                            goal: { type: "string", description: "Main goal in Arabic" },
                            deadline: { type: "string", description: "Expected completion date" },
                            interests: { type: "array", items: { type: "string" } }
                        },
                        required: ["goal", "interests"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "create_study_plan",
                    description: "Generate and save a structured study plan for the student. Call this ONLY when you have enough info (Goal, Level, Time).",
                    parameters: {
                        type: "object",
                        properties: {
                            title: { type: "string", description: "Arabic title of the path (e.g. مسار احتراف الفرونت إيند)" },
                            description: { type: "string", description: "Arabic summary" },
                            duration: { type: "string", description: "e.g. 3 Months" },
                            totalHours: { type: "number" },
                            milestones: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        title: { type: "string", description: "Milestone name (Arabic)" },
                                        description: { type: "string", description: "Broad activities (Arabic)" }
                                    }
                                }
                            }
                        },
                        required: ["title", "description", "duration", "totalHours", "milestones"]
                    }
                }
            }
        ];

        // 3. Agent Reasoning Loop
        let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: `أنت "العميل التنفيذي" (Executive AI Agent) لمنصة "تعلم" (Taeallum).
مدير مشروع تعليمي، وظيفتك هي توجيه الطالب عبر "مسار اكتشاف" ذكي لتحويله من زائر إلى طالب متخصص.

[بروتوكول الاكتشاف الموجه - High-Precision Branching]:

الخطوة 1: الفرز القطاعي (Sector Selection)
اسأل: "أهلاً بك في منصة تعلم! أنا مستشارك الذكي. لنبدأ رحلة احترافك، أي من هذه العوالم يثير فضولك أكثر؟"
يجب أن يكون ردك حصراً بصيغة: [SUGGESTIONS: بناء المواقع والتطبيقات | عالم البيانات والذكاء الاصطناعي | التصميم والابتكار البصري | التجارة والتسويق والأعمال | اللغات ومهارات الأوفيس]

الخطوة 2: التخصص الدقيق (Specialty Selection)
بناءً على اختيار الطالب، اعرض السؤال: "لتخصص [القطاع المختارة]، إليك التخصصات المتاحة. أي منها ترغب في احترافه؟"
ثم أدرج الخيارات حصراً في كتلة [SUGGESTIONS: ...] المقابلة:
- إذا اختار (بناء المواقع والتطبيقات): [SUGGESTIONS: تطوير الويب | تطبيقات الموبايل | هندسة البرمجيات | تطوير الألعاب | الأمن السيبراني | DevOps والبنية التحتية | الحوسبة السحابية | اختبار البرمجيات]
- إذا اختار (عالم البيانات والذكاء الاصطناعي): [SUGGESTIONS: الذكاء الاصطناعي وتعلم الآلة | تحليل البيانات وذكاء الأعمال]
- إذا اختار (التصميم والابتكار البصري): [SUGGESTIONS: تصميم UI/UX | التصميم الجرافيكي | الموشن جرافيك | المونتاج وصناعة المحتوى]
- إذا اختار (التجارة والتسويق والأعمال): [SUGGESTIONS: التسويق الرقمي | التجارة الإلكترونية | الدروب شوبينج | إدارة المشاريع | إدارة المنتجات | التداول والاستثمار]
- إذا اختار (اللغات ومهارات الأوفيس): [SUGGESTIONS: برامج الأوفيس | تعلم اللغات | أخرى]

الخطوة 3: تحديد الجهد (Time Commitment)
اسأل: "اختيار ذكي! لكي أضع لك جدولاً زمنياً دقيقاً، كم ساعة ستمنح 'تعلم' من وقتك يومياً؟"
يجب أن يكون ردك حصراً بصيغة: [SUGGESTIONS: ساعة واحدة (مسار هادئ) | 3 ساعات (مسار مكثف) | 5 ساعات فأكثر (مسار صاروخي)]

الخطوة 4: التنفيذ (Action)
بمجرد جمع (التخصص، الوقت)، استدعِ أداة "create_study_plan" فوراً.

[قواعد صارمة جداً ونهائية]:
1. ممنوع منعاً باتاً سرد التخصصات كنص عادي أو برؤوس أقلام (Bulleted list).
2. أي رد يحتوي على تخصصات أو خيارات يجب أن ينتهي بكتلة [SUGGESTIONS: ...] حصراً لكي تظهر كأزرار للطالب.
3. بما أن لوحة الكتابة مقفلة لدى الطالب، فإن الخيار الوحيد له هو النقر على الأزرار التي ترسلها أنت. إذا لم ترسل أزراراً، سيتوقف الحوار.
4. تحدث بالعربية الفصحى بأسلوب تنفيذي مهني ومختصر جداً.
5. لا تكرر ترحيبك.

سياق الطالب الحالي: ${contextSummary}`
            },
            { role: "user", content: userMessage }
        ];

        let finalResponse = "";
        let toolLogs: string[] = [];
        let maxSteps = 5;

        for (let i = 0; i < maxSteps; i++) {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                tools,
                tool_choice: "auto",
            });

            const reply = response.choices[0].message;
            messages.push(reply);

            if (reply.tool_calls) {
                for (const toolCall of reply.tool_calls) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);

                    let result;
                    if (functionName === "search_platform_courses") {
                        toolLogs.push(`استكشاف الموارد: ${args.query || args.category || ""}`);
                        const searchResult = await db.query.courses.findMany({
                            where: eq(courses.isPublished, true),
                            limit: 10
                        });
                        result = searchResult.map(c => `- ${c.title} (ID: ${c.id}) (${c.level}): ${c.aiDescription || c.description}`);
                    }
                    else if (functionName === "enroll_student") {
                        toolLogs.push(`تنفيذ عملية تسجيل: ${args.courseTitle}`);
                        const [existing] = await db.select().from(enrollments)
                            .where(
                                and(
                                    eq(enrollments.userId, userId!),
                                    eq(enrollments.courseId, args.courseId)
                                )
                            );

                        if (existing) {
                            result = { success: false, message: "الطالب مسجل بالفعل في هذا الكورس" };
                        } else {
                            await db.insert(enrollments).values({
                                userId: userId!,
                                courseId: args.courseId,
                                progress: 0
                            });
                            result = { success: true, message: `تم تسجيل الطالب بنجاح في ${args.courseTitle}` };
                        }
                    }
                    else if (functionName === "set_learning_goals") {
                        toolLogs.push(`تحديث الذاكرة الدائمة: ${args.goal}`);
                        const updatedPrefs = {
                            ...(userRecord?.preferences as object || {}),
                            main_goal: args.goal,
                            deadline: args.deadline,
                            interests: args.interests,
                            lastUpdated: new Date().toISOString()
                        };
                        await db.update(users)
                            .set({ preferences: updatedPrefs })
                            .where(eq(users.id, userId!));
                        result = { success: true, message: "تم تحديث الأهداف في الذاكرة" };
                    }
                    else if (functionName === "create_study_plan") {
                        toolLogs.push(`هندسة مسار تعليمي: ${args.title}`);
                        const [savedPlan] = await db.insert(studyPlans).values({
                            userId: userId!,
                            title: args.title,
                            description: args.description,
                            duration: args.duration,
                            totalHours: args.totalHours,
                            planData: args,
                            status: "active"
                        }).returning();
                        result = { success: true, planId: savedPlan.id };
                    }

                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(result)
                    });
                }
                continue;
            }

            finalResponse = reply.content || "";
            break;
        }

        res.json({
            reply: finalResponse,
            logs: toolLogs,
            status: "success"
        });

    } catch (error: any) {
        console.error("[AGENT ERROR]:", error);

        res.status(error?.status || 500).json({
            message: message,
            detail: error.message,
            code: error.code || "unknown"
        });
    }
});

export default router;
