import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { requireAuth } from "./auth";
import { db } from "../db";
import { aiSessions, aiMessages, subscriptions, users, courses, enrollments, studyPlans } from "../db/schema";
import { eq, desc, and, ilike, or } from "drizzle-orm";

import { getConfig } from "../config";

const router = Router();

const getOpenAI = () => {
    try {
        const key = getConfig("OPENAI_API_KEY");
        if (!key) {
            console.error("[CHATBOT] No API key found in config");
            return null;
        }
        console.log(`[CHATBOT] Using API key starting with: ${key.slice(0, 12)}...`);
        return new OpenAI({ apiKey: key });
    } catch (err) {
        console.error("[CHATBOT] getOpenAI Exception:", err);
        return null;
    }
};


// GET: Test route to verify router mounting
router.get("/ping", (req, res) => res.json({ status: "alive", path: "/api/chatbot/ping" }));

// GET: Load active session + messages for the current user
router.get("/session", requireAuth, async (req: Request, res: Response) => {

    try {
        const userId = req.session.userId;
        console.log(`[CHATBOT] GET /session for user ${userId}`);

        // Find the latest active chatbot session
        const [session] = await db.select()

            .from(aiSessions)
            .where(and(
                eq(aiSessions.userId, userId!),
                eq(aiSessions.sessionType, "chatbot"),
                eq(aiSessions.status, "active")
            ))
            .orderBy(desc(aiSessions.createdAt))
            .limit(1);

        if (!session) {
            return res.json({ session: null, messages: [] });
        }

        // Load all messages for this session
        const msgs = await db.select()
            .from(aiMessages)
            .where(eq(aiMessages.sessionId, session.id))
            .orderBy(aiMessages.createdAt);

        res.json({
            session: { id: session.id, status: session.status },
            messages: msgs.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.createdAt,
                logs: (m.metadata as any)?.logs || []
            }))
        });
    } catch (error: any) {
        console.error("[SESSION LOAD ERROR]:", error);
        res.status(500).json({ message: "فشل تحميل الجلسة" });
    }
});

// POST: Reset session (start new conversation)
router.post("/reset-session", requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId;

        // Mark all active chatbot sessions as completed
        const activeSessions = await db.select()
            .from(aiSessions)
            .where(and(
                eq(aiSessions.userId, userId!),
                eq(aiSessions.sessionType, "chatbot"),
                eq(aiSessions.status, "active")
            ));

        for (const session of activeSessions) {
            await db.update(aiSessions)
                .set({ status: "completed", updatedAt: new Date() })
                .where(eq(aiSessions.id, session.id));
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error("[SESSION RESET ERROR]:", error);
        res.status(500).json({ message: "فشل إعادة تعيين الجلسة" });
    }
});

// POST: Send a message (main chatbot endpoint)
router.post("/", requireAuth, async (req: Request, res: Response) => {
    try {
        const { message: userMessage } = req.body;
        const userId = req.session.userId;
        console.log(`[CHATBOT] POST / for user ${userId}: "${userMessage?.slice(0, 50)}..."`);


        const openai = getOpenAI();
        if (!openai) {
            return res.status(500).json({ message: "OpenAI is not configured" });
        }

        if (!userMessage) {
            return res.status(400).json({ message: "Message is required" });
        }

        // 1. Get or create a chatbot session
        let [session] = await db.select()
            .from(aiSessions)
            .where(and(
                eq(aiSessions.userId, userId!),
                eq(aiSessions.sessionType, "chatbot"),
                eq(aiSessions.status, "active")
            ))
            .orderBy(desc(aiSessions.createdAt))
            .limit(1);

        if (!session) {
            [session] = await db.insert(aiSessions).values({
                userId: userId!,
                sessionType: "chatbot",
                status: "active",
                messagesCount: 0
            }).returning();
        }

        // 2. Load previous messages from this session
        const previousMessages = await db.select()
            .from(aiMessages)
            .where(eq(aiMessages.sessionId, session.id))
            .orderBy(aiMessages.createdAt);

        // 3. Save the new user message
        await db.insert(aiMessages).values({
            sessionId: session.id,
            role: "user",
            content: userMessage
        });

        // 4. Context Retrieval
        const [userRecord] = await db.select().from(users).where(eq(users.id, userId!)).limit(1);
        const adminEmail = (process.env.ADMIN_EMAIL || "hamzaali200410@gmail.com").toLowerCase();
        const isAdmin = userRecord?.email.toLowerCase() === adminEmail || userRecord?.role === "admin";

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

        // 5. Define Tools
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
                    description: "Generate and save a structured study plan for the student, linking it to actual courses on the platform. IMPORTANT: Before calling this, you MUST call search_platform_courses to find available courses and include their IDs in the milestones.",
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
                                    }
                                }
                            },
                            categoryHint: { type: "string", description: "Optional category slug or keyword to strictly filter courses (e.g. 'coding', 'languages')" }
                        },
                        required: ["title", "description", "duration", "totalHours", "milestones"]
                    }
                }
            }
        ];

        // 6. Build OpenAI messages array with FULL conversation history
        const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: `[System Instruction: Taallm Executive Agent]
أنت "العميل التنفيذي" لمنصة تعلّم (Taallm) التعليمية. مهمتك هي قيادة الطالب عبر 4 مراحل للوصول إلى واحد من الـ 16 تخصصاً المتاحة.

[بروتوكول التعامل]:
1. ممنوع الارتجال: اتبع المسار حصراً (القطاع -> التخصص -> المستوى -> الجدولة).
2. منع القوائم النصية: لا تكتب خيارات مرقمة (مثل 1، 2، 3) داخل نص الرسالة.
3. الخيارات فقط: ضع جميع الاختيارات حصراً داخل كتلة [SUGGESTIONS: خيار|خيار].
4. الرسالة سطر واحد: مهنية، مباشرة، وبدون تعداد نقطي أو رقمي في النص.
5. اللغة: عربية مهنية ودودة.

[خريطة التخصصات (16 تخصص)]:
- البرمجة والتطوير -> [تطوير الويب|تطوير تطبيقات الهاتف|تطوير الألعاب|هندسة البرمجيات و DevOps]
- البيانات والذكاء الاصطناعي -> [البيانات والذكاء الاصطناعي|تحليل البيانات|الحوسبة السحابية|الأمن السيبراني]
- التصميم الإبداعي -> [تصميم الواجهات UI/UX|الموشن جرافيك|المونتاج وصناعة المحتوى]
- الأعمال والتسويق -> [التسويق الرقمي|التجارة الإلكترونية|التداول والاستثمار|إدارة المشاريع]
- اللغات -> [علم اللغات]

[تفاصيل كل تخصص (3 مستويات)]:
تطوير الويب: مبتدئ(HTML5,CSS3,تجاوب) متوسط(JavaScript,Tailwind) متقدم(Node.js/PHP,SQL/NoSQL)
البيانات والذكاء الاصطناعي: مبتدئ(Python,Pandas) متوسط(إحصاء,تعلم آلة) متقدم(شبكات عصبية,NLP,AI توليدي)
تطوير تطبيقات الهاتف: مبتدئ(Dart/Swift,واجهات) متوسط(API,State) متقدم(Firebase,إشعارات,متاجر)
الأمن السيبراني: مبتدئ(شبكات,Linux) متوسط(تشفير,ثغرات) متقدم(اختراق أخلاقي,جنائي رقمي)
تصميم الواجهات UI/UX: مبتدئ(أسس التصميم,Figma) متوسط(UX Research,Wireframes) متقدم(Design Systems,تحريك)
التسويق الرقمي: مبتدئ(أساسيات,سوشيال ميديا) متوسط(إعلانات مدفوعة) متقدم(SEO,تحليل بيانات تسويقية)
المونتاج وصناعة المحتوى: مبتدئ(قص,ترتيب) متوسط(ألوان,صوت) متقدم(VFX,مونتاج سينمائي)
الحوسبة السحابية: مبتدئ(مفهوم السحابة) متوسط(AWS/Azure) متقدم(هندسة حلول,Scaling)
التجارة الإلكترونية: مبتدئ(بناء متجر) متوسط(تسويق,شحن) متقدم(دروب شوبينج,توسع)
التداول والاستثمار: مبتدئ(بورصة,محفظة) متوسط(تحليل فني,شموع) متقدم(إدارة مخاطر,تداول آلي)
إدارة المشاريع: مبتدئ(تخطيط,Trello) متوسط(Agile,Scrum) متقدم(PMP,ميزانيات)
الموشن جرافيك: مبتدئ(Illustrator,After Effects) متوسط(تحريك,Keyframes) متقدم(3D,إنتاج دعائي)
تطوير الألعاب: مبتدئ(Unity/Unreal) متوسط(فيزياء,AI أعداء) متقدم(Multiplayer,نشر)
تحليل البيانات: مبتدئ(Excel متقدم) متوسط(SQL) متقدم(Power BI,تقارير تفاعلية)
هندسة البرمجيات و DevOps: مبتدئ(Clean Code,Git) متوسط(Docker,اختبارات) متقدم(Kubernetes,CI/CD)
علم اللغات: مبتدئ(مفردات,A1/A2) متوسط(جمل,B1/B2) متقدم(طلاقة,C1/C2)

[قواعد العزل الصارمة - هام جداً]:
- ممنوع خلط التخصصات: مسار "تطوير الويب" يجب أن يحتوي حصراً على دورات ويب.
- ممنوع جلب دورات الأمن السيبراني لمسار الويب، أو دورات البرمجة لمسار اللغات.
- استخدم 'categoryHint' (مثل: web-development, data-ai, cybersecurity, ui-ux-design, digital-marketing, video-editing, cloud-computing, e-commerce, trading, project-management, motion-graphics, game-development, data-analytics, software-engineering-devops, language-learning, mobile-development) في 'create_study_plan' لقفص النتائج داخل التخصص.
- إذا لم تجد دورة مطابقة تماماً في 'search_platform_courses'، اجعل المرحلة وصفية ولكن لا تربطها بكورسات عشوائية من تخصصات أخرى.
- ابحث عن الكورسات أولاً باستخدام 'search_platform_courses' قبل إنشاء الخطة.

[مراحل العمل]:
1. المرحلة 1 (القطاع والتخصص): عرض القطاعات الخمسة، ثم عند الاختيار عرض التخصصات الدقيقة فوراً.
2. المرحلة 2 (المستوى): [SUGGESTIONS: مبتدئ كلياً|لديه أساسيات|مستوى متوسط].
3. المرحلة 3 (الجدولة): [SUGGESTIONS: مكثف (+20 ساعة)|متوسط (10-20 ساعة)|هادئ (-10 ساعات)].
4. المرحلة 4 (التنفيذ): استدعاء tools (البحث عن الكورسات وبناء الخطة) ثم عرض التقرير النهائي.

[المرحلة النهائية (الخطة جاهزة)]:
عند انتهاء الجدولة، قم فوراً باستدعاء 'search_platform_courses' و 'create_study_plan' ثم أظهر الرسالة التالية فقط (بدون أي عناوين تقنية أو قوائم):
"لقد قمت بتصميم مسار [اسم التخصص] خصيصاً لك. خطتك جاهزة الآن للبدء بناءً على وقتك المتاح. اضغط على الزر أدناه للانتقال للمسارات والبدء فوراً." [SUGGESTIONS: ابدأ الآن] [REDIRECT: /tracks] [SYSTEM_ACT: ENROLLMENT_SUCCESS]

سياق الطالب الحالي: ${contextSummary}`
            }
        ];

        // Add previous messages from DB as conversation history
        for (const msg of previousMessages) {
            openaiMessages.push({
                role: msg.role as "user" | "assistant",
                content: msg.content
            });
        }

        // Add the current user message
        openaiMessages.push({ role: "user", content: userMessage });

        // 7. Agent Reasoning Loop
        let finalResponse = "";
        let toolLogs: string[] = [];
        let maxSteps = 8;

        for (let i = 0; i < maxSteps; i++) {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: openaiMessages,
                tools,
                tool_choice: "auto",
            });

            const reply = response.choices[0].message;
            openaiMessages.push(reply);

            if (reply.tool_calls) {
                for (const toolCall of reply.tool_calls) {
                    const functionName = toolCall.function.name;
                    let args;
                    try {
                        args = JSON.parse(toolCall.function.arguments);
                    } catch (err) {
                        console.error("Failed to parse tool arguments:", toolCall.function.arguments);
                        openaiMessages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify({ error: "Invalid JSON arguments" })
                        });
                        continue;
                    }

                    let result;
                    if (functionName === "search_platform_courses") {
                        toolLogs.push(`استكشاف الموارد: ${args.query || args.category || ""}`);

                        // Build search conditions
                        const conditions: any[] = [eq(courses.isPublished, true)];
                        const searchResult = await db.query.courses.findMany({
                            where: eq(courses.isPublished, true),
                            limit: 50
                        });

                        // Filter by query keyword matching if provided
                        let filtered = searchResult;
                        if (args.query) {
                            const q = args.query.toLowerCase();
                            filtered = searchResult.filter(c =>
                                (c.title && c.title.toLowerCase().includes(q)) ||
                                (c.description && c.description.toLowerCase().includes(q)) ||
                                (c.aiDescription && c.aiDescription.toLowerCase().includes(q))
                            );
                            // If no results for query, don't return everything, keep it empty for AI to know
                        }
                        if (args.level) {
                            const leveled = filtered.filter(c => c.level === args.level);
                            if (leveled.length > 0) filtered = leveled;
                        }

                        result = filtered.map(c => `- ${c.title}(ID: ${c.id})(المستوى: ${c.level}): ${c.aiDescription || c.description?.slice(0, 150)}`);
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

                        // Fetch all platform courses to match with milestones
                        let courseQuery = db.query.courses.findMany({
                            where: eq(courses.isPublished, true),
                            with: { category: true }
                        });
                        const allCoursesRaw = await courseQuery;

                        // Strict filter if categoryHint provided
                        let allCourses = allCoursesRaw;
                        if (args.categoryHint) {
                            const hint = args.categoryHint.toLowerCase();
                            allCourses = allCoursesRaw.filter(c =>
                                (c.category?.slug || "").toLowerCase().includes(hint) ||
                                (c.category?.name || "").toLowerCase().includes(hint) ||
                                (c.category?.description || "").toLowerCase().includes(hint)
                            );

                            // NO FALLBACK. If no courses in this category, allCourses remains filtered (empty)
                            // This forces strict isolation as requested.
                            if (allCourses.length === 0) {
                                console.log(`🔒 Isolation Enforced: No courses match categoryHint '${hint}'.`);
                            }
                        }

                        // Build enriched milestones with course details
                        const enrichedMilestones = (args.milestones || []).map((m: any) => {
                            const milestoneCoursIds = m.courseIds || [];
                            // Match ONLY against already filtered 'allCourses' (which respects categoryHint)
                            const matchedCourses = allCourses.filter(c => milestoneCoursIds.includes(c.id));

                            return {
                                title: m.title,
                                description: m.description,
                                courses: matchedCourses.map(c => ({
                                    id: c.id,
                                    title: c.title,
                                    slug: c.slug,
                                    level: c.level,
                                    thumbnail: c.thumbnail
                                }))
                            };
                        });

                        // If no courses were matched via AI, auto-match by keyword within the ISOLATED subset
                        const totalMatched = enrichedMilestones.reduce((sum: number, m: any) => sum + m.courses.length, 0);
                        if (totalMatched === 0 && allCourses.length > 0) {
                            for (const milestone of enrichedMilestones) {
                                const keywords = milestone.title.toLowerCase().split(/\s+/);
                                const matched = allCourses.filter(c =>
                                    keywords.some((kw: string) => kw.length > 2 && (
                                        (c.title && c.title.toLowerCase().includes(kw)) ||
                                        (c.description && c.description.toLowerCase().includes(kw))
                                    ))
                                ).slice(0, 3);
                                milestone.courses = matched.map(c => ({
                                    id: c.id,
                                    title: c.title,
                                    slug: c.slug,
                                    level: c.level,
                                    thumbnail: c.thumbnail
                                }));
                            }
                        }

                        // Auto-enroll the student in all matched courses
                        const allMatchedCourseIds = new Set<string>();
                        for (const m of enrichedMilestones) {
                            for (const c of m.courses) {
                                allMatchedCourseIds.add(c.id);
                            }
                        }

                        for (const courseId of Array.from(allMatchedCourseIds)) {
                            const [existing] = await db.select().from(enrollments)
                                .where(and(
                                    eq(enrollments.userId, userId!),
                                    eq(enrollments.courseId, courseId)
                                ));
                            if (!existing) {
                                await db.insert(enrollments).values({
                                    userId: userId!,
                                    courseId: courseId,
                                    progress: 0
                                });
                            }
                        }

                        toolLogs.push(`تم ربط ${allMatchedCourseIds.size} كورس من المنصة بالمسار`);

                        const planDataWithCourses = {
                            ...args,
                            milestones: enrichedMilestones,
                            linkedCoursesCount: allMatchedCourseIds.size
                        };

                        const [savedPlan] = await db.insert(studyPlans).values({
                            userId: userId!,
                            sessionId: session.id,
                            title: args.title,
                            description: args.description,
                            duration: args.duration,
                            totalHours: args.totalHours,
                            planData: planDataWithCourses,
                            status: "active"
                        }).returning();

                        // Mark session as completed
                        await db.update(aiSessions)
                            .set({ status: "completed", generatedPlan: planDataWithCourses, updatedAt: new Date() })
                            .where(eq(aiSessions.id, session.id));

                        result = { success: true, planId: savedPlan.id, linkedCourses: allMatchedCourseIds.size };
                    }

                    openaiMessages.push({
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

        // --- 9. SAFETY GUARDS: CLEAN RESPONSE & ENSURE SUGGESTIONS ---

        // A. Clean EVERYTHING technical from the user view
        const techPatterns = [
            /\[SYSTEM_ACT:[^\]]+\]/gi,
            /\[REDIRECT:[^\]]+\]/gi,
            /\[(?:المرحلة|Reporting|المسار|الخطة|الحالة|الرسالة|التقرير)[^\]]*\]/gi, // Strip user-seen headers
            /^-?\s*\[[^\]]+\]/gm, // Strip bullet points starting with brackets
            /ID:\s*[a-z0-9-]+/gi, // Strip any leaked IDs
            /\d+[\.\)]\s*\[[^\]]+\]/g // Strip numbered tech blocks
        ];
        techPatterns.forEach(p => finalResponse = finalResponse.replace(p, ""));

        // B. DETECT NUMBERED LISTS (1. X 2. Y) and convert to SUGGESTIONS if no pipe-suggestions exist
        const listRegex = /\d+[\.\)]\s*([^\d\n\r|\[]+)/g;
        const potentialOptions: string[] = [];
        let listMatch;
        while ((listMatch = listRegex.exec(finalResponse)) !== null) {
            potentialOptions.push(listMatch[1].trim());
        }

        // C. HARD GUARD: Capture and normalize suggestions
        const flexibleSuggestionRegex = /\[(?:SUGGESTIONS:\s*)?([^\]\|]+\|[^\]\d][^\]]*|ابدأ الآن)\]/gi;
        const suggestionsMatches = Array.from(finalResponse.matchAll(flexibleSuggestionRegex));

        let finalSuggestions = "";
        const lowerResponse = finalResponse.toLowerCase();

        // Smarter phase detection for fallback
        const isFinalPhase = lowerResponse.includes("جاهز") || lowerResponse.includes("ابدأ") ||
            lowerResponse.includes("مسار") || lowerResponse.includes("تم تجهيز") ||
            finalResponse.includes("REDIRECT: /tracks");

        if (suggestionsMatches.length > 0) {
            const lastMatch = suggestionsMatches[suggestionsMatches.length - 1];
            finalSuggestions = `\n[SUGGESTIONS: ${lastMatch[1].trim()}]`;
        } else {
            // Fallback logic
            let contextSuggestions = "البرمجة والتطوير 💻|البيانات والذكاء الاصطناعي 🤖|التصميم الإبداعي 🎨|الأعمال والتسويق 📈|اللغات 🌍";

            if (isFinalPhase) {
                contextSuggestions = "ابدأ الآن 🚀";
            } else if (lowerResponse.includes("مستوى") || lowerResponse.includes("مبتدئ")) {
                contextSuggestions = "مبتدئ - أبدأ من الصفر 🌱|عندي أساسيات بسيطة 📚|مستوى متوسط - أريد التعمق 🔥";
            } else if (lowerResponse.includes("ساعة") || lowerResponse.includes("وقت") || lowerResponse.includes("جدولة")) {
                contextSuggestions = "مكثف - أكثر من 20 ساعة أسبوعياً ⚡|متوسط - من 10 إلى 20 ساعة 📅|هادئ - أقل من 10 ساعات 🕐";
            }
            finalSuggestions = `\n[SUGGESTIONS: ${contextSuggestions}]`;
        }

        // ALWAYS strip ALL brackets from the main message to prevent leaks
        finalResponse = finalResponse.replace(/\[[^\]]*\]/g, "").trim();
        finalResponse += finalSuggestions;

        finalResponse = finalResponse.replace(/\s+/g, " ").trim();
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
        finalResponse = finalResponse.replace(uuidRegex, "").replace(/\(ID:\s*\)/gi, "").replace(/ID:\s*/gi, "");


        // 10. Save the assistant's response in the database
        await db.insert(aiMessages).values({
            sessionId: session.id,
            role: "assistant",
            content: finalResponse,
            metadata: toolLogs.length > 0 ? { logs: toolLogs } : null
        });


        // Update message count
        await db.update(aiSessions)
            .set({
                messagesCount: (session.messagesCount || 0) + 2, // user + assistant
                updatedAt: new Date()
            })
            .where(eq(aiSessions.id, session.id));
        // 8. Finalize Response and determine step
        let step = 1;

        if (finalResponse.includes("REDIRECT: /tracks") || finalResponse.includes("التقرير")) {
            step = 5; // Final Plan
        } else if (finalResponse.includes("جدولة") || finalResponse.includes("ساعة")) {
            step = 4; // Schedule
        } else if (finalResponse.includes("المستوى") || finalResponse.includes("مبتدئ")) {
            step = 3; // Level
        } else if (finalResponse.includes("تطوير الويب") || finalResponse.includes("الذكاء الاصطناعي") || finalResponse.includes("تخصص")) {
            // If it lists specialties or asks for one
            step = 2; // Specialty
        } else if (finalResponse.includes("مرحباً") || finalResponse.includes("القطاعات") || finalResponse.includes("مجال")) {
            step = 1; // Sector/Discovery
        }



        res.json({
            message: finalResponse,
            logs: toolLogs,
            step: step
        });

    } catch (error: any) {
        console.error("CRITICAL [AGENT ERROR]:", error);

        // Log detailed error for admin
        const errorLog = {
            message: error.message,
            status: error.status,
            type: error.type,
            code: error.code,
            time: new Date().toISOString(),
            userId: req.session.userId
        };

        console.error("[CHATBOT_LOG]", JSON.stringify(errorLog));

        // Detect specific OpenAI errors
        let userMessage = "عذراً، المساعد الذكي يواجه تقلبات في الاتصال حالياً. يرجى المحاولة بعد لحظات.";
        if (error.status === 401) userMessage = "خطأ في المصادقة: لم يتم تهيئة مفتاح الذكاء الاصطناعي بشكل صحيح.";
        if (error.status === 429) userMessage = "تم تجاوز حد الطلبات للذكاء الاصطناعي. يرجى الانتظار قليلاً.";

        res.status(error.status || 500).json({
            message: userMessage,
            detail: error.message,
            code: error.code || "ERR_AGENT_FLOW"
        });
    }
});

export default router;
