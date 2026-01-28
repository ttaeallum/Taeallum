import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "../db";
import * as schema from "../db/schema";
import { eq, desc, sql, and, ilike } from "drizzle-orm";
import { z } from "zod";
import { specializationCategories } from "../lib/specializations";

const router = Router();
const adminEmail = (process.env.ADMIN_EMAIL || "hamzali200410@gmail.com").toLowerCase();

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
            recentActivity: recentLogs,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching stats" });
    }
});

// --- 2. Categories CRUD ---
router.get("/categories", async (req: Request, res: Response) => {
    await db
        .insert(schema.categories)
        .values(specializationCategories)
        .onConflictDoNothing({ target: schema.categories.slug });

    const allCategories = await db.select().from(schema.categories).orderBy(desc(schema.categories.createdAt));
    res.json(allCategories);
});

router.post("/categories/seed-specializations", async (req: Request, res: Response) => {
    try {
        const created = await db
            .insert(schema.categories)
            .values(specializationCategories)
            .onConflictDoNothing({ target: schema.categories.slug })
            .returning();
        res.json({ ok: true, createdCount: created.length });
    } catch (error) {
        console.error("Seed categories error:", error);
        res.status(500).json({ message: "Failed to seed categories" });
    }
});

router.post("/categories", async (req: Request, res: Response) => {
    const { name, slug, description } = req.body;
    const [newCat] = await db.insert(schema.categories).values({ name, slug, description }).returning();
    await logAudit(adminEmail, "CREATE", "Category", newCat.id, newCat);
    res.json(newCat);
});

router.put("/categories/:id", async (req: Request, res: Response) => {
    const { name, slug, description } = req.body;
    const [updated] = await db.update(schema.categories).set({ name, slug, description }).where(eq(schema.categories.id, String(req.params.id))).returning();
    await logAudit(adminEmail, "UPDATE", "Category", updated.id, updated);
    res.json(updated);
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
    // Force isPublished to true if not specified, so it appears immediately on the home page
    const courseData = {
        ...req.body,
        isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true
    };
    const [newCourse] = await db.insert(schema.courses).values(courseData).returning();
    await logAudit(adminEmail, "CREATE", "Course", newCourse.id, newCourse);
    res.json(newCourse);
});

router.put("/courses/:id", async (req: Request, res: Response) => {
    const [updated] = await db.update(schema.courses).set({ ...req.body, updatedAt: new Date() }).where(eq(schema.courses.id, String(req.params.id))).returning();
    await logAudit(adminEmail, "UPDATE", "Course", updated.id, updated);
    res.json(updated);
});

router.delete("/courses/:id", async (req: Request, res: Response) => {
    await db.delete(schema.courses).where(eq(schema.courses.id, req.params.id as string));
    await logAudit(adminEmail, "DELETE", "Course", req.params.id as string);
    res.json({ ok: true });
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
    const [updated] = await db.update(schema.sections).set(req.body).where(eq(schema.sections.id, String(req.params.id))).returning();
    await logAudit(adminEmail, "UPDATE", "Section", updated.id, updated);
    res.json(updated);
});

router.delete("/sections/:id", async (req: Request, res: Response) => {
    await db.delete(schema.sections).where(eq(schema.sections.id, String(req.params.id)));
    await logAudit(adminEmail, "DELETE", "Section", req.params.id as string);
    res.json({ ok: true });
});

router.post("/lessons", async (req: Request, res: Response) => {
    const [newLesson] = await db.insert(schema.lessons).values(req.body).returning();
    await logAudit(adminEmail, "CREATE", "Lesson", newLesson.id, newLesson);
    res.json(newLesson);
});

router.put("/lessons/:id", async (req: Request, res: Response) => {
    const [updated] = await db.update(schema.lessons).set(req.body).where(eq(schema.lessons.id, String(req.params.id))).returning();
    await logAudit(adminEmail, "UPDATE", "Lesson", updated.id, updated);
    res.json(updated);
});

router.delete("/lessons/:id", async (req: Request, res: Response) => {
    await db.delete(schema.lessons).where(eq(schema.lessons.id, String(req.params.id)));
    await logAudit(adminEmail, "DELETE", "Lesson", req.params.id as string);
    res.json({ ok: true });
});

// --- 6. Audit Logs ---
router.get("/audit", async (req: Request, res: Response) => {
    const logs = await db.select().from(schema.adminAuditLogs).orderBy(desc(schema.adminAuditLogs.createdAt)).limit(100);
    res.json(logs);
});

export default router;
