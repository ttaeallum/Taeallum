import { Router, type Request, type Response } from "express";
import { db } from "../db";
import * as schema from "../db/schema";
import { eq, asc } from "drizzle-orm";

const router = Router();

// Get course curriculum (sections and lessons)
router.get("/:courseId/curriculum", async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;

        // Fetch sections for the course
        const sections = await db.select()
            .from(schema.sections)
            .where(eq(schema.sections.courseId, String(courseId)))
            .orderBy(asc(schema.sections.order));

        // Fetch lessons for all these sections
        const allLessons = await Promise.all(sections.map(async (section) => {
            const lessons = await db.select()
                .from(schema.lessons)
                .where(eq(schema.lessons.sectionId, section.id))
                .orderBy(asc(schema.lessons.order));
            return {
                ...section,
                lessons
            };
        }));

        res.json(allLessons);
    } catch (error: any) {
        console.error("Error fetching curriculum:", error);
        res.status(500).json({ message: "Failed to fetch curriculum" });
    }
});

// Update lesson progress (mark as completed)
router.post("/lesson/:lessonId/complete", async (req: Request, res: Response) => {
    try {
        const { lessonId } = req.params;
        const userId = req.session.userId;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        // Logic for tracking progress can be expanded here
        // For now we'll just return success
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to update progress" });
    }
});

export default router;
