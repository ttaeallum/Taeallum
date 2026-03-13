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
        const userId = (req.session as any).userId as string;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        // 1. Update Students table 'completed_lessons'
        const [studentProfile] = await db.select().from(schema.students).where(eq(schema.students.userId, userId)).limit(1);
        if (studentProfile) {
            const completed = Array.isArray(studentProfile.completedLessons) ? studentProfile.completedLessons as string[] : [];
            if (!completed.includes(lessonId as string)) {
                completed.push(lessonId as string);
                await db.update(schema.students)
                    .set({ completedLessons: completed, updatedAt: new Date() })
                    .where(eq(schema.students.userId, userId));
            }
        }

        res.json({ success: true, message: "تم تسجيل إكمال الدرس بنجاح" });
    } catch (error: any) {
        console.error("Progress Error:", error);
        res.status(500).json({ message: "Failed to update progress" });
    }
});

// Submit Quiz Result
router.post("/quiz/:quizId/submit", async (req: Request, res: Response) => {
    try {
        const { quizId } = req.params;
        const { score, answers } = req.body;
        const userId = (req.session as any).userId as string;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        // 1. Save results
        await db.insert(schema.quizSubmissions).values({
            userId: userId,
            quizId: quizId as string,
            score: Number(score),
            answers: answers,
            createdAt: new Date()
        });

        // 2. Update Student level logic
        await db.update(schema.students)
            .set({
                quizPerformance: `Last Quiz Score: ${score}%`,
                updatedAt: new Date()
            })
            .where(eq(schema.students.userId, userId));

        res.json({ success: true, message: "تم حفظ النتيجة وفحص أدائك جارٍ من قبل الذكاء الاصطناعي" });
    } catch (error: any) {
        console.error("Quiz Submit Error:", error);
        res.status(500).json({ message: "Failed to submit quiz" });
    }
});

export default router;
