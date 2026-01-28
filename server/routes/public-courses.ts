import { Router } from "express";
import { db } from "../db";
import * as schema from "../db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { specializationCategories } from "../lib/specializations";

const router = Router();

// Get all specializations (categories)
router.get("/categories", async (_req, res) => {
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
router.get("/", async (req, res) => {
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
router.get("/featured", async (req, res) => {
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
router.get("/:slug", async (req, res) => {
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

export default router;
