import { Router, type Request, type Response } from "express";
import { db } from "../db";
import * as schema from "../db/schema";
import { and, eq, desc } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

// Get user's enrolled courses
router.get("/my-courses", async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userEnrollments = await db.select({
            course: schema.courses,
            progress: schema.enrollments.progress,
            enrolledAt: schema.enrollments.enrolledAt
        })
            .from(schema.enrollments)
            .innerJoin(schema.courses, eq(schema.enrollments.courseId, schema.courses.id))
            .where(eq(schema.enrollments.userId, userId))
            .orderBy(desc(schema.enrollments.enrolledAt));

        const coursesWithDetails = userEnrollments.map(({ course, progress, enrolledAt }) => ({
            ...course,
            progress,
            enrolledAt
        }));

        res.json(coursesWithDetails);
    } catch (error) {
        console.error("Error fetching my courses:", error);
        res.status(500).json({ message: "Failed to fetch enrolled courses" });
    }
});

// Check if a user has access to a specific course
router.get("/course/:courseId", async (req: Request, res: Response) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.session.userId;

        if (userId) {
            // IF LOGGED IN, ACCESS IS ALWAYS ALLOWED (All courses are free)
            // But let's check if they are already enrolled, if not, enroll them automatically
            const [enrollment] = await db.select()
                .from(schema.enrollments)
                .where(
                    and(
                        eq(schema.enrollments.userId, userId),
                        eq(schema.enrollments.courseId, String(courseId))
                    )
                )
                .limit(1);

            if (!enrollment) {
                try {
                    await db.insert(schema.enrollments).values({
                        userId,
                        courseId: String(courseId),
                    });
                } catch (err) {
                    // Ignore duplicate enrollment errors silently
                    console.log("[ACCESS] Enrollment already exists (race condition)");
                }
            }

            return res.json({ allowed: true });
        }

        return res.json({ allowed: false, reason: "not_logged_in" });
    } catch (error) {
        console.error("Access check error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
