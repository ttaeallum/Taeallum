import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { requireAuth } from "./auth";
import { db } from "../db";
import { aiSessions, aiMessages, subscriptions, users, courses, categories, enrollments, studyPlans } from "../db/schema";

// Helper to sort courses by level: beginner → intermediate → advanced
const LEVEL_ORDER: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
const sortByLevel = <T extends { level: string | null }>(arr: T[]): T[] =>
    [...arr].sort((a, b) => (LEVEL_ORDER[a.level || 'beginner'] || 99) - (LEVEL_ORDER[b.level || 'beginner'] || 99));
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
                    description: "Search for specific educational courses available on the Taeallum platform. IMPORTANT: Always provide the category slug to filter by specialization. Results are automatically sorted from beginner to advanced.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "Keywords to search in title or description" },
                            category: { type: "string", description: "Category slug MUST match one of: web-development, data-ai, cybersecurity, ui-ux-design, digital-marketing, video-editing, cloud-computing, e-commerce, trading, project-management, motion-graphics, game-development, data-analytics, software-engineering-devops, language-learning, mobile-development" },
                            level: { type: "string", enum: ["beginner", "intermediate", "advanced"], description: "Filter by specific level. Omit to get ALL levels sorted beginner→advanced" }
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
أنت "العميل التنفيذي" لمنصة تعلّم. مهمتك قيادة الطالب عبر مسار احترافي يبدأ بالأساسيات المشتركة وينتهي بالتخصص الدقيق.

[بروتوكول العمل]:
1. ممنوع الارتجال: اتبع التسلسل (القطاع -> التخصص المتفرع -> المستوى والجدولة).
2. هيكلية المسار: كل خطة تبدأ "إجبارياً" بـ "المواد الأساسية المشتركة (Core IT)".
3. الخيارات فقط: ضع جميع الاختيارات حصراً داخل كتلة [SUGGESTIONS: خيار|خيار].
4. الرسالة سطر واحد: مهنية، مباشرة، وبدون تعداد.

[بروتوكول الاختيار (مرحلتين)]:
- المرحلة الأولى: عرض القطاعات الـ 7 الرئيسية.
- المرحلة الثانية: عند اختيار قطاع، اعرض فوراً التخصصات المتفرعة منه.

[خريطة القطاعات والخيارات المتفرعة]:
1. علوم الحاسوب (Computer Science): [أساسيات البرمجة|الخوارزميات|هيكلة الأنظمة]
2. هندسة البرمجيات (Software Engineering): [تطوير البرامج|إدارة قواعد البيانات|هندسة الفحص]
3. علم البيانات والذكاء الاصطناعي (Data Science & AI): [تحليل البيانات|تعلم الآلة (ML)|التعلم العميق (DL)]
4. الأمن السيبراني (Cybersecurity): [أمن الشبكات|الاختراق الأخلاقي|التحليل الجنائي الرقمي]
5. إنترنت الأشياء والاتصالات (IOT & Communications): [شبكات وبروتوكولات|الأنظمة المدمجة|بناء معمارية IOT]
6. نظم المعلومات الإدارية (Management Information): [إدارة مشاريع IT|عمليات الأعمال|أنظمة ERP]
7. تطوير الويب والهاتف (Web & Mobile Development): [تطوير الويب|تطوير تطبيقات الهاتف|تصميم UI/UX]

[المواد الأساسية المشتركة لكافة التخصصات (Core IT)]:
هذه المواد توضع في بداية "أي" خطة دراسية:
(Programming Basics, Structured Code, OOP 1, Data Structures, Algorithms, Linear Algebra, Probability, Operating Systems, Networks).

[قواعد العزل والتوليد]:
- عند توليد الخطة (create_study_plan):
  - المرحلة 1: أساسيات الـ Core IT + مبادئ التخصص المختار.
  - المرحلة 2: تعمق في التخصص المتفرع (Specialization Courses).
  - المرحلة 3: المواد المتقدمة والاحترافية للتخصص (Advanced Content).

[المرحلة النهائية]:
بعد انتهاء الأسئلة، استدعِ 'search_platform_courses' و 'create_study_plan' ثم أظهر:
"تم تصميم مسارك الكامل من الأساسيات المشتركة حتى تخصص [اسم المتفرع]. خطتك جاهزة." [SUGGESTIONS: ابدأ الآن] [REDIRECT: /tracks] [SYSTEM_ACT: ENROLLMENT_SUCCESS]

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

                        // Fetch all published courses with their category info
                        const searchResult = await db.query.courses.findMany({
                            where: eq(courses.isPublished, true),
                            with: { category: true },
                            limit: 50
                        });

                        // Filter by category slug if provided (STRICT filter for specialization isolation)
                        let filtered = searchResult;
                        if (args.category) {
                            const catSlug = args.category.toLowerCase();
                            filtered = searchResult.filter(c =>
                                (c.category?.slug || "").toLowerCase().includes(catSlug) ||
                                (c.category?.name || "").toLowerCase().includes(catSlug)
                            );
                        }

                        // Filter by query keyword matching if provided
                        if (args.query) {
                            const q = args.query.toLowerCase();
                            filtered = filtered.filter(c =>
                                (c.title && c.title.toLowerCase().includes(q)) ||
                                (c.description && c.description.toLowerCase().includes(q)) ||
                                (c.aiDescription && c.aiDescription.toLowerCase().includes(q))
                            );
                        }

                        // Filter by level if specified
                        if (args.level) {
                            const leveled = filtered.filter(c => c.level === args.level);
                            if (leveled.length > 0) filtered = leveled;
                        }

                        // Sort by level: beginner → intermediate → advanced
                        filtered = sortByLevel(filtered);

                        result = filtered.map((c, idx) => `${idx + 1}. ${c.title}(ID: ${c.id})(المستوى: ${c.level})(التصنيف: ${c.category?.name || 'غير محدد'}): ${c.aiDescription || c.description?.slice(0, 150)}`);
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

                        // Build enriched milestones with course details, sorted by level
                        const enrichedMilestones = (args.milestones || []).map((m: any) => {
                            const milestoneCoursIds = m.courseIds || [];
                            // Match ONLY against already filtered 'allCourses' (which respects categoryHint)
                            const matchedCourses = sortByLevel(allCourses.filter(c => milestoneCoursIds.includes(c.id)));

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
                        // Then sort by level order (beginner → intermediate → advanced)
                        const totalMatched = enrichedMilestones.reduce((sum: number, m: any) => sum + m.courses.length, 0);
                        if (totalMatched === 0 && allCourses.length > 0) {
                            // Auto-distribute courses across milestones by level
                            const sortedCourses = sortByLevel(allCourses);
                            let beginnerCourses = sortedCourses.filter(c => c.level === 'beginner');
                            let intermediateCourses = sortedCourses.filter(c => c.level === 'intermediate');
                            let advancedCourses = sortedCourses.filter(c => c.level === 'advanced');

                            // Fill empty buckets from nearest available level
                            if (intermediateCourses.length === 0 && beginnerCourses.length > 0) {
                                intermediateCourses = [...beginnerCourses];
                            } else if (intermediateCourses.length === 0 && advancedCourses.length > 0) {
                                intermediateCourses = [...advancedCourses];
                            }
                            if (advancedCourses.length === 0 && intermediateCourses.length > 0) {
                                advancedCourses = [...intermediateCourses];
                            } else if (advancedCourses.length === 0 && beginnerCourses.length > 0) {
                                advancedCourses = [...beginnerCourses];
                            }
                            if (beginnerCourses.length === 0 && intermediateCourses.length > 0) {
                                beginnerCourses = [...intermediateCourses];
                            }

                            // Last resort: split evenly
                            if (beginnerCourses.length === 0 && intermediateCourses.length === 0 && advancedCourses.length === 0 && sortedCourses.length > 0) {
                                const third = Math.ceil(sortedCourses.length / 3);
                                beginnerCourses = sortedCourses.slice(0, third);
                                intermediateCourses = sortedCourses.slice(third, third * 2);
                                advancedCourses = sortedCourses.slice(third * 2);
                            }


                            const courseBuckets = [beginnerCourses, intermediateCourses, advancedCourses];

                            for (let i = 0; i < enrichedMilestones.length; i++) {
                                const milestone = enrichedMilestones[i];
                                // Distribute by level buckets to milestones: milestone 0=beginner, 1=intermediate, 2=advanced
                                const bucket = courseBuckets[Math.min(i, courseBuckets.length - 1)] || [];
                                if (bucket.length > 0) {
                                    milestone.courses = bucket.map(c => ({
                                        id: c.id,
                                        title: c.title,
                                        slug: c.slug,
                                        level: c.level,
                                        thumbnail: c.thumbnail
                                    }));
                                } else {
                                    // Fallback: keyword search
                                    const keywords = milestone.title.toLowerCase().split(/\s+/);
                                    const matched = sortByLevel(allCourses.filter(c =>
                                        keywords.some((kw: string) => kw.length > 2 && (
                                            (c.title && c.title.toLowerCase().includes(kw)) ||
                                            (c.description && c.description.toLowerCase().includes(kw))
                                        ))
                                    )).slice(0, 3);
                                    milestone.courses = matched.map(c => ({
                                        id: c.id,
                                        title: c.title,
                                        slug: c.slug,
                                        level: c.level,
                                        thumbnail: c.thumbnail
                                    }));
                                }
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

                        // Enforce exactly 3 milestones: مبتدئ، متوسط، متقدم
                        const LEVEL_LABELS = ['المستوى الأول - مبتدئ', 'المستوى الثاني - متوسط', 'المستوى الثالث - متقدم'];
                        let finalMilestones = enrichedMilestones;

                        if (finalMilestones.length > 3) {
                            const extra = finalMilestones.slice(3);
                            const extraCourses = extra.flatMap((m: any) => m.courses || []);
                            finalMilestones = finalMilestones.slice(0, 3);
                            finalMilestones[2].courses = [...(finalMilestones[2].courses || []), ...extraCourses];
                        } else {
                            while (finalMilestones.length < 3) {
                                finalMilestones.push({ title: LEVEL_LABELS[finalMilestones.length], description: '', courses: [] });
                            }
                        }

                        finalMilestones = finalMilestones.map((m: any, idx: number) => ({
                            ...m,
                            title: LEVEL_LABELS[idx] || m.title
                        }));

                        const planDataWithCourses = {
                            ...args,
                            milestones: finalMilestones,
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
