import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "../db";
import * as schema from "../db/schema";
import { eq, desc, sql, and, ilike } from "drizzle-orm";
import { z } from "zod";
import { specializationCategories } from "../lib/specializations";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// --- Multer Configuration (Memory storage for base64 persistence) ---
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only images are allowed"));
        }
    }
});

const adminEmail = (process.env.ADMIN_EMAIL || "hamzaali200410@gmail.com").toLowerCase();

// --- Middleware: Verify Admin ---
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.session && req.session.isAdmin) {
        return next();
    }

    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Admin access required" });
    }

    try {
        const [user] = await db.select().from(schema.users).where(eq(schema.users.id, req.session.userId)).limit(1);
        if (!user) {
            return res.status(401).json({ message: "Admin only" });
        }
        const isAdmin = user.email.toLowerCase() === adminEmail || user.role === "admin";
        if (!isAdmin) {
            return res.status(403).json({ message: "Admin only" });
        }
        req.session.isAdmin = true;
        next();
    } catch (err) {
        console.error("Admin auth error:", err);
        return res.status(500).json({ message: "Admin auth error" });
    }
}

// --- Utility: Log Audit ---
async function logAudit(adminUsername: string, action: string, entityType: string, entityId?: string, details?: any) {
    try {
        await db.insert(schema.adminAuditLogs).values({
            adminId: adminUsername,
            action,
            entityType,
            entityId,
            details,
        });
    } catch (err) {
        console.error("Audit log error:", err);
    }
}

// Apply admin protection to all routes in this router
router.use(requireAdmin);

// --- 1. Dashboard Stats ---
router.get("/stats", async (req: Request, res: Response) => {
    try {
        const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
        const [courseCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.courses);
        const [enrollmentCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.enrollments);
        const [totalRevenue] = await db.select({ sum: sql<string>`sum(amount)` }).from(schema.orders).where(eq(schema.orders.status, "completed"));

        // Calculate Monthly Growth (Last 6 Months)
        const monthlyGrowth = await db.execute(sql`
            WITH months AS (
                SELECT generate_series(
                    date_trunc('month', current_date) - interval '5 months',
                    date_trunc('month', current_date),
                    interval '1 month'
                )::date AS month
            )
            SELECT 
                to_char(m.month, 'Mon') as name,
                (SELECT count(*) FROM ${schema.users} u WHERE date_trunc('month', u.created_at) = m.month) as "مستخدمين",
                (SELECT count(*) FROM ${schema.enrollments} e WHERE date_trunc('month', e.enrolled_at) = m.month) as "التحاقات"
            FROM months m
            ORDER BY m.month ASC
        `);

        // Category Distribution
        const categoryDist = await db.execute(sql`
            SELECT c.name, count(co.id)::int as value
            FROM ${schema.categories} c
            LEFT JOIN ${schema.courses} co ON co.category_id = c.id
            GROUP BY c.name
            HAVING count(co.id) > 0
        `);

        const recentLogs = await db.query.adminAuditLogs.findMany({
            limit: 10,
            orderBy: [desc(schema.adminAuditLogs.createdAt)],
        });

        res.json({
            stats: {
                users: userCount.count,
                courses: courseCount.count,
                enrollments: enrollmentCount.count,
                revenue: totalRevenue.sum || "0",
            },
            chartData: monthlyGrowth.rows,
            categoryData: categoryDist.rows,
            recentActivity: recentLogs,
        });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: "Error fetching stats" });
    }
});

// --- 2. Categories CRUD ---
router.get("/categories", async (req: Request, res: Response) => {
    const allCategories = await db.select().from(schema.categories).orderBy(desc(schema.categories.createdAt));
    res.json(allCategories);
});

router.post("/categories/seed-specializations", async (req: Request, res: Response) => {
    try {
        let createdCount = 0;
        for (const spec of specializationCategories) {
            try {
                // Ensure slug is clean
                const cleanSlug = spec.slug.toLowerCase().trim();

                const [result] = await db
                    .insert(schema.categories)
                    .values({ ...spec, slug: cleanSlug })
                    .onConflictDoUpdate({
                        target: schema.categories.slug,
                        set: {
                            name: spec.name,
                            description: spec.description
                        }
                    })
                    .returning();

                if (result) createdCount++;
            } catch (innerError) {
                console.warn(`Failed to seed specialty "${spec.name}":`, innerError);
            }
        }
        res.json({ ok: true, createdCount });
    } catch (error) {
        console.error("Seed categories overall error:", error);
        res.status(500).json({ message: "فشل إضافة التخصصات" });
    }
});

router.post("/categories", async (req: Request, res: Response) => {
    try {
        const { name, slug, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: "اسم التخصص مطلوب" });
        }

        // Generate a robust slug if missing or contains Arabic (improving searchability/SEO)
        let finalSlug = slug;
        const containsArabic = /[\u0600-\u06FF]/.test(name);

        if (!finalSlug || containsArabic) {
            // Create a clean slug: replace spaces and typical special chars with hyphens
            // We want to preserve Arabic characters here so they can be encoded
            const base = name.toLowerCase().trim()
                .replace(/[\s\t\n\r!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~]+/g, '-') // Replace common symbols/spaces
                .replace(/-+/g, '-') // collapse multiple hyphens
                .replace(/^-+|-+$/g, ''); // trim hyphens

            if (containsArabic) {
                // For Arabic, encode it.
                finalSlug = base ? encodeURIComponent(base).slice(0, 150) : `cat-${Date.now().toString(36)}`;
            } else {
                finalSlug = base || `cat-${Date.now().toString(36)}`;
            }
        }

        const [newCat] = await db.insert(schema.categories).values({
            name,
            slug: finalSlug,
            description
        }).returning();

        await logAudit(adminEmail, "CREATE", "Category", newCat.id, newCat);
        res.json(newCat);
    } catch (error: any) {
        console.error("Create Category Error:", error);
        if (error.code === "23505") {
            return res.status(400).json({ message: "هذا التخصص موجود بالفعل (الاسم أو الرابط مكرر)" });
        }
        res.status(500).json({ message: `فشل إضافة التخصص: ${error.message || "خطأ داخلي"}` });
    }
});

router.put("/categories/:id", async (req: Request, res: Response) => {
    try {
        const { name, slug, description } = req.body;
        const categoryId = String(req.params.id);

        if (!name) {
            return res.status(400).json({ message: "اسم التخصص مطلوب" });
        }

        // Generate a robust slug if missing or contains Arabic (consistent with POST logic)
        let finalSlug = slug;
        const containsArabic = /[\u0600-\u06FF]/.test(name);

        if (!finalSlug || containsArabic) {
            const base = name.toLowerCase().trim()
                .replace(/[\s\t\n\r!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');

            if (containsArabic) {
                finalSlug = base ? encodeURIComponent(base).slice(0, 150) : `cat-${Date.now().toString(36)}`;
            } else {
                finalSlug = base || `cat-${Date.now().toString(36)}`;
            }
        }

        const [updated] = await db.update(schema.categories)
            .set({ name, slug: finalSlug, description })
            .where(eq(schema.categories.id, categoryId))
            .returning();

        if (!updated) {
            return res.status(404).json({ message: "التخصص غير موجود" });
        }

        await logAudit(adminEmail, "UPDATE", "Category", updated.id, updated);
        res.json(updated);
    } catch (error: any) {
        if (error.code === "23505") {
            return res.status(400).json({ message: "هذا التخصص موجود بالفعل (الاسم أو الرابط مكرر)" });
        }
        res.status(500).json({ message: "فشل تحديث التخصص: " + (error.message || "خطأ داخلي") });
    }
});

router.delete("/categories/:id", async (req: Request, res: Response) => {
    await db.delete(schema.categories).where(eq(schema.categories.id, String(req.params.id)));
    await logAudit(adminEmail, "DELETE", "Category", req.params.id as string);
    res.json({ ok: true });
});

// --- 3. Courses CRUD ---
router.get("/courses", async (req: Request, res: Response) => {
    const { q = "", page = "1", limit = "10" } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const filter = q ? ilike(schema.courses.title, `%${q}%`) : undefined;

    const data = await db.query.courses.findMany({
        where: filter,
        with: { category: true },
        limit: Number(limit),
        offset: offset,
        orderBy: [desc(schema.courses.createdAt)],
    });

    const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.courses).where(filter);

    res.json({ data, total: totalCount.count });
});

router.post("/courses", async (req: Request, res: Response) => {
    try {
        console.log("[ADMIN] Received course creation request:", req.body);
        const { title, slug, ...rest } = req.body;

        if (!title) {
            console.warn("[ADMIN] Course title is missing");
            return res.status(400).json({ message: "Course title is required" });
        }

        // Generate a fallback slug if missing or invalid
        const finalSlug = slug || title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

        const courseData = {
            ...rest,
            title,
            slug: finalSlug,
            isPublished: req.body.isPublished !== undefined ? req.body.isPublished : false,
            updatedAt: new Date(),
        };

        const [newCourse] = await db.insert(schema.courses).values(courseData).returning();
        console.log("[ADMIN] Course created successfully:", newCourse.id);
        await logAudit(adminEmail, "CREATE", "Course", newCourse.id, newCourse);
        res.json(newCourse);
    } catch (error: any) {
        console.error("Create course error:", error);
        if (error.code === "23505") { // Unique constraint violation (slug)
            return res.status(400).json({ message: "هذا الرابط (slug) مستخدم بالفعل، يرجى تغيير عنوان الكورس" });
        }
        res.status(500).json({ message: error.message || "Failed to create course" });
    }
});

router.put("/courses/:id", async (req: Request, res: Response) => {
    try {
        const courseId = String(req.params.id);
        const { id, createdAt, ...updateData } = req.body; // Prevent updating protected fields

        const [updated] = await db.update(schema.courses)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(schema.courses.id, courseId))
            .returning();

        if (!updated) {
            return res.status(404).json({ message: "Course not found" });
        }

        await logAudit(adminEmail, "UPDATE", "Course", updated.id, updated);
        res.json(updated);
    } catch (error: any) {
        console.error("Update course error:", error);
        res.status(500).json({ message: error.message || "Failed to update course" });
    }
});

router.delete("/courses/:id", async (req: Request, res: Response) => {
    try {
        const courseId = String(req.params.id);
        const [deleted] = await db.delete(schema.courses)
            .where(eq(schema.courses.id, courseId))
            .returning();

        if (!deleted) {
            return res.status(404).json({ message: "Course not found" });
        }

        await logAudit(adminEmail, "DELETE", "Course", courseId);
        res.json({ ok: true });
    } catch (error: any) {
        console.error("Delete course error:", error);
        res.status(500).json({ message: "Failed to delete course" });
    }
});

// --- 4. Users ---
router.get("/users", async (req: Request, res: Response) => {
    const { q = "" } = req.query;
    const filter = q ? ilike(schema.users.fullName, `%${q}%`) : undefined;

    const allUsers = await db.select().from(schema.users).where(filter).orderBy(desc(schema.users.createdAt));
    res.json(allUsers);
});

// --- 5. Curriculum (Sections & Lessons) ---
router.get("/courses/:courseId/curriculum", async (req: Request, res: Response) => {
    const sections = await db.select().from(schema.sections).where(eq(schema.sections.courseId, req.params.courseId as string)).orderBy(schema.sections.order);
    const curriculum = await Promise.all(sections.map(async (section) => {
        const lessons = await db.select().from(schema.lessons).where(eq(schema.lessons.sectionId, section.id)).orderBy(schema.lessons.order);
        return { ...section, lessons };
    }));
    res.json(curriculum);
});

router.post("/sections", async (req: Request, res: Response) => {
    const [newSection] = await db.insert(schema.sections).values(req.body).returning();
    await logAudit(adminEmail, "CREATE", "Section", newSection.id, newSection);
    res.json(newSection);
});

router.put("/sections/:id", async (req: Request, res: Response) => {
    try {
        const sectionId = String(req.params.id);
        const { id, ...updateData } = req.body;
        const [updated] = await db.update(schema.sections)
            .set(updateData)
            .where(eq(schema.sections.id, sectionId))
            .returning();

        if (!updated) return res.status(404).json({ message: "Section not found" });

        await logAudit(adminEmail, "UPDATE", "Section", updated.id, updated);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Failed to update section" });
    }
});

router.delete("/sections/:id", async (req: Request, res: Response) => {
    try {
        const sectionId = String(req.params.id);
        const [deleted] = await db.delete(schema.sections)
            .where(eq(schema.sections.id, sectionId))
            .returning();

        if (!deleted) return res.status(404).json({ message: "Section not found" });

        await logAudit(adminEmail, "DELETE", "Section", sectionId);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete section" });
    }
});

router.post("/lessons", async (req: Request, res: Response) => {
    const [newLesson] = await db.insert(schema.lessons).values(req.body).returning();
    await logAudit(adminEmail, "CREATE", "Lesson", newLesson.id, newLesson);
    res.json(newLesson);
});

router.put("/lessons/:id", async (req: Request, res: Response) => {
    try {
        const lessonId = String(req.params.id);
        const { id, ...updateData } = req.body;
        const [updated] = await db.update(schema.lessons)
            .set(updateData)
            .where(eq(schema.lessons.id, lessonId))
            .returning();

        if (!updated) return res.status(404).json({ message: "Lesson not found" });

        await logAudit(adminEmail, "UPDATE", "Lesson", updated.id, updated);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Failed to update lesson" });
    }
});

router.delete("/lessons/:id", async (req: Request, res: Response) => {
    try {
        const lessonId = String(req.params.id);
        const [deleted] = await db.delete(schema.lessons)
            .where(eq(schema.lessons.id, lessonId))
            .returning();

        if (!deleted) return res.status(404).json({ message: "Lesson not found" });

        await logAudit(adminEmail, "DELETE", "Lesson", lessonId);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete lesson" });
    }
});

// --- 6. Enrollments ---
router.get("/enrollments", async (req: Request, res: Response) => {
    const data = await db.query.enrollments.findMany({
        with: { user: true, course: true },
        orderBy: [desc(schema.enrollments.enrolledAt)],
        limit: 50,
    });
    res.json(data);
});

// --- 7. Orders & Approvals ---
router.get("/orders", async (req: Request, res: Response) => {
    const data = await db.query.orders.findMany({
        with: { user: true, course: true },
        orderBy: [desc(schema.orders.createdAt)],
    });
    res.json(data);
});

router.post("/orders/:id/approve", async (req: Request, res: Response) => {
    try {
        const orderId = String(req.params.id);
        const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);

        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.status === "completed") return res.json({ message: "Order already completed" });

        // 1. Mark order as completed
        await db.update(schema.orders).set({ status: "completed" }).where(eq(schema.orders.id, orderId));

        // 2. Grant Access
        if (order.courseId) {
            // Course Enrollment
            try {
                await db.insert(schema.enrollments).values({
                    userId: order.userId,
                    courseId: order.courseId,
                });
            } catch (err) {
                console.log("[ADMIN] Enrollment already exists");
            }
        } else if (order.planId) {
            // Subscription Activation
            await db.insert(schema.subscriptions).values({
                userId: order.userId,
                plan: order.planId,
                status: "active",
                amount: order.amount,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            });
        }

        await logAudit(adminEmail, "APPROVE_PAYMENT", "Order", orderId, { userId: order.userId });
        res.json({ ok: true, message: "تم تفعيل الطلب بنجاح" });
    } catch (error) {
        console.error("Approve order error:", error);
        res.status(500).json({ message: "Failed to approve order" });
    }
});

router.post("/orders/:id/reject", async (req: Request, res: Response) => {
    const { reason } = req.body;
    const orderId = String(req.params.id);
    await db.update(schema.orders).set({ status: "rejected", adminNotes: reason }).where(eq(schema.orders.id, orderId));
    await logAudit(adminEmail, "REJECT_PAYMENT", "Order", orderId, { reason });
    res.json({ ok: true });
});

// --- 9. File Upload (Persistent via base64 data URL) ---
router.post("/upload", upload.single("image"), (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    // Convert to base64 data URL for persistent storage (survives Render deploys)
    const base64Data = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // Also save to disk as fallback for local development
    try {
        const uploadDir = "uploads/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filename = req.file.fieldname + "-" + uniqueSuffix + path.extname(req.file.originalname);
        fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
    } catch (e) {
        // Disk save is optional - data URL is the primary response
        console.log("[Upload] Disk save failed (expected on Render):", e);
    }

    res.json({ url: dataUrl });
});

// --- 10. Notifications ---
router.get("/notifications", async (req: Request, res: Response) => {
    try {
        const pendingOrders = await db.query.orders.findMany({
            where: eq(schema.orders.status, "pending"),
            with: { user: true, course: true },
            orderBy: [desc(schema.orders.createdAt)],
            limit: 5
        });

        const [totalPending] = await db.select({ count: sql<number>`count(*)` })
            .from(schema.orders)
            .where(eq(schema.orders.status, "pending"));

        res.json({
            pendingOrders,
            unreadCount: totalPending.count
        });
    } catch (error) {
        console.error("Notifications fetch error:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
});

// --- 11. YouTube Playlist Bulk Importer ---
router.post("/import-playlist", async (req: Request, res: Response) => {
    const { playlistUrl, sectionId } = req.body;
    if (!playlistUrl || !sectionId) {
        return res.status(400).json({ message: "Playlist URL and Section ID are required" });
    }

    try {
        console.log(`[Import] Fetching playlist: ${playlistUrl}`);
        const response = await fetch(playlistUrl);
        const html = await response.text();

        // Regex to extract ytInitialData JSON
        const dataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
        if (!dataMatch) {
            throw new Error("Could not find playlist data. Make sure the playlist is public and contains videos.");
        }

        const data = JSON.parse(dataMatch[1]);

        // Navigate the complex YouTube JSON structure to get video items
        let videoItems: any[] = [];
        try {
            // Standard Playlist structure
            const contents = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;
            if (contents) videoItems = contents;
        } catch (e) {
            console.log("[Import] Standard structure failed, trying alternative...");
        }

        if (videoItems.length === 0) {
            // Fallback for different layouts
            try {
                videoItems = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.richGridRenderer?.contents || [];
            } catch (e) { }
        }

        const lessonsToInsert = videoItems
            .filter((v: any) => v.playlistVideoRenderer)
            .map((v: any, index: number) => {
                const renderer = v.playlistVideoRenderer;
                const videoId = renderer.videoId;
                const title = renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || "Untitled Lesson";
                const durationSeconds = parseInt(renderer.lengthSeconds) || 0;

                return {
                    sectionId,
                    title,
                    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    order: index + 1,
                    isFree: false,
                    duration: durationSeconds,
                };
            });

        if (lessonsToInsert.length === 0) {
            return res.status(400).json({ message: "No videos found in the playlist. Make sure it is public." });
        }

        console.log(`[Import] Found ${lessonsToInsert.length} videos. Inserting...`);
        await db.insert(schema.lessons).values(lessonsToInsert);

        await logAudit(adminEmail, "IMPORT_PLAYLIST", "Section", sectionId, {
            playlistUrl,
            count: lessonsToInsert.length
        });

        res.json({
            success: true,
            message: `تم استيراد ${lessonsToInsert.length} درس بنجاح`,
            count: lessonsToInsert.length
        });
    } catch (error) {
        console.error("Playlist import error:", error);
        res.status(500).json({
            message: "فشل استيراد قائمة التشغيل. تأكد من أن الرابط صحيح وعام (Public).",
            error: String(error)
        });
    }
});

export default router;
