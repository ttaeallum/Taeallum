import { Router, type Request, type Response } from "express";
import { db } from "../db";
import * as schema from "../db/schema";
import { asc, desc, eq } from "drizzle-orm";
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

// Get all published courses
router.get("/", async (req: Request, res: Response) => {
    try {
        const allCourses = await db.query.courses.findMany({
            where: eq(schema.courses.isPublished, true),
            with: { category: true },
            orderBy: [desc(schema.courses.createdAt)],
        });
        res.json(allCourses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Failed to fetch courses" });
    }
});

// Get featured courses for homepage
router.get("/featured", async (req: Request, res: Response) => {
    try {
        const featured = await db.query.courses.findMany({
            where: eq(schema.courses.isPublished, true),
            with: { category: true },
            limit: 4,
            orderBy: [desc(schema.courses.createdAt)],
        });
        res.json(featured);
    } catch (error) {
        console.error("Error fetching featured courses:", error);
        res.status(500).json({ message: "Failed to fetch featured courses" });
    }
});

// Get single course by slug
router.get("/:slug", async (req: Request, res: Response) => {
    try {
        const [course] = await db.query.courses.findMany({
            where: eq(schema.courses.slug, req.params.slug),
            with: { category: true },
            limit: 1,
        });

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.json(course);
    } catch (error) {
        console.error("Error fetching course detail:", error);
        res.status(500).json({ message: "Failed to fetch course detail" });
    }
});

// Get curriculum for a course
router.get("/:courseId/curriculum", async (req: Request, res: Response) => {
    try {
        const sections = await db.select().from(schema.sections).where(eq(schema.sections.courseId, req.params.courseId)).orderBy(schema.sections.order);
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
        const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, req.params.lessonId)).limit(1);
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
