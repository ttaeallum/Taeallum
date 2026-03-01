import { Router, type Request, type Response } from "express";
import { db } from "../db";
import * as schema from "../db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { specializationCategories } from "../lib/specializations";

const router = Router();

// Get all specializations (categories)
router.get("/categories", async (req: Request, res: Response) => {
    try {
        await db
            .insert(schema.categories)
            .values(specializationCategories)
            .onConflictDoNothing({ target: schema.categories.slug });

        const categories = await db
            .select()
            .from(schema.categories)
            .orderBy(asc(schema.categories.name));
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Failed to fetch categories" });
    }
});

// Get platform stats
router.get("/stats", async (req: Request, res: Response) => {
    try {
        const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
        const [courseCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.courses);
        res.json({
            totalUsers: userCount.count,
            totalCourses: courseCount.count,
            platformRating: 4.9,
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Failed to fetch stats" });
    }
});

// Get all published courses
router.get("/", async (req: Request, res: Response) => {
    console.log("[ROUTER] Public Courses GET / hit");
    try {
        const allCourses = await db.select({
            id: schema.courses.id,
            title: schema.courses.title,
            slug: schema.courses.slug,
            thumbnail: schema.courses.thumbnail,
            price: schema.courses.price,
            instructor: schema.courses.instructor,
            level: schema.courses.level,
            createdAt: schema.courses.createdAt,
            categoryId: schema.courses.categoryId,
            categoryName: schema.categories.name,
            lessonsCount: sql<number>`CAST(COUNT(${schema.lessons.id}) AS INTEGER)`,
            totalDuration: sql<number>`CAST(COALESCE(SUM(${schema.lessons.duration}), 0) AS INTEGER)`,
        })
            .from(schema.courses)
            .leftJoin(schema.categories, eq(schema.courses.categoryId, schema.categories.id))
            .leftJoin(schema.sections, eq(schema.sections.courseId, schema.courses.id))
            .leftJoin(schema.lessons, eq(schema.lessons.sectionId, schema.sections.id))
            .where(eq(schema.courses.isPublished, true))
            .groupBy(schema.courses.id, schema.categories.name)
            .orderBy(desc(schema.courses.createdAt));

        const coursesWithDetails = allCourses.map(course => ({
            ...course,
            students: 0,
            image: course.thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
            category: {
                name: course.categoryName || "عام",
                slug: specializationCategories.find(s => s.name === course.categoryName)?.slug || "other",
                id: course.categoryId
            },
            duration: Number(course.totalDuration) || 0,
            lessonsCount: Number(course.lessonsCount) || 0
        }));

        res.json(coursesWithDetails);
    } catch (error: any) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Failed", error: error.message });
    }
});

// Get featured courses for homepage
router.get("/featured", async (req: Request, res: Response) => {
    try {
        const featured = await db.select({
            id: schema.courses.id,
            title: schema.courses.title,
            slug: schema.courses.slug,
            thumbnail: schema.courses.thumbnail,
            price: schema.courses.price,
            instructor: schema.courses.instructor,
            level: schema.courses.level,
            createdAt: schema.courses.createdAt,
            categoryId: schema.courses.categoryId,
            categoryName: schema.categories.name,
            lessonsCount: sql<number>`CAST(COUNT(${schema.lessons.id}) AS INTEGER)`,
            totalDuration: sql<number>`CAST(COALESCE(SUM(${schema.lessons.duration}), 0) AS INTEGER)`,
        })
            .from(schema.courses)
            .leftJoin(schema.categories, eq(schema.courses.categoryId, schema.categories.id))
            .leftJoin(schema.sections, eq(schema.sections.courseId, schema.courses.id))
            .leftJoin(schema.lessons, eq(schema.lessons.sectionId, schema.sections.id))
            .where(eq(schema.courses.isPublished, true))
            .groupBy(schema.courses.id, schema.categories.name)
            .limit(4)
            .orderBy(desc(schema.courses.createdAt));

        const featuredWithStats = featured.map(course => ({
            ...course,
            students: 0,
            image: course.thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
            category: course.categoryName || "عام",
            duration: Number(course.totalDuration) || 0,
            lessonsCount: Number(course.lessonsCount) || 0
        }));

        res.json(featuredWithStats);
    } catch (error: any) {
        console.error("Error fetching featured courses:", error);
        res.status(500).json({ message: "Failed", error: error.message });
    }
});

// Get single course by slug
router.get("/:slug", async (req: Request, res: Response) => {
    try {
        // Try direct lookup (decoded by express)
        let [course] = await db.query.courses.findMany({
            where: eq(schema.courses.slug, String(req.params.slug)),
            with: { category: true },
            limit: 1,
        });

        if (!course) {
            const encodedSlug = encodeURIComponent(String(req.params.slug));
            [course] = await db.query.courses.findMany({
                where: eq(schema.courses.slug, encodedSlug),
                with: { category: true },
                limit: 1,
            });
        }

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Add lessonsCount and duration
        const [stats] = await db.select({
            lessonsCount: sql<number>`CAST(COUNT(${schema.lessons.id}) AS INTEGER)`,
            totalDuration: sql<number>`CAST(COALESCE(SUM(${schema.lessons.duration}), 0) AS INTEGER)`,
        })
            .from(schema.sections)
            .leftJoin(schema.lessons, eq(schema.lessons.sectionId, schema.sections.id))
            .where(eq(schema.sections.courseId, course.id));

        res.json({
            ...course,
            lessonsCount: stats?.lessonsCount || 0,
            duration: stats?.totalDuration || 0
        });
    } catch (error) {
        console.error("Error fetching course detail:", error);
        res.status(500).json({ message: "Failed to fetch course detail" });
    }
});

// Get curriculum for a course
router.get("/:courseId/curriculum", async (req: Request, res: Response) => {
    try {
        const sections = await db.select().from(schema.sections).where(eq(schema.sections.courseId, String(req.params.courseId))).orderBy(schema.sections.order);
        const curriculum = await Promise.all(sections.map(async (section) => {
            const lessons = await db.select().from(schema.lessons).where(eq(schema.lessons.sectionId, section.id)).orderBy(schema.lessons.order);
            return { ...section, lessons };
        }));
        res.json(curriculum);
    } catch (error) {
        console.error("Error fetching curriculum:", error);
        res.status(500).json({ message: "Failed to fetch curriculum" });
    }
});

// Get single lesson detail
router.get("/lesson/:lessonId", async (req: Request, res: Response) => {
    try {
        const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, String(req.params.lessonId))).limit(1);
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // Also need courseId to fetch curriculum, get it from section
        const [section] = await db.select().from(schema.sections).where(eq(schema.sections.id, lesson.sectionId)).limit(1);

        res.json({ ...lesson, courseId: section.courseId });
    } catch (error) {
        console.error("Error fetching lesson:", error);
        res.status(500).json({ message: "Failed to fetch lesson" });
    }
});

export default router;
