import { Router, type Request, type Response } from "express";
import { db } from "../db";
import * as schema from "../db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

// Check if a user has access to a specific course
router.get("/course/:courseId", async (req: Request, res: Response) => {
    try {
        if (!req.session.userId) {
            return res.json({ allowed: false, reason: "not_logged_in" });
        }

        const courseId = req.params.courseId;
        const userId = req.session.userId;

        // Check if there is an active enrollment for this user and course
        const [enrollment] = await db.select()
            .from(schema.enrollments)
            .where(
                and(
                    eq(schema.enrollments.userId, userId),
                    eq(schema.enrollments.courseId, courseId)
                )
            )
            .limit(1);

        if (enrollment) {
            return res.json({ allowed: true });
        }

        // Alternatively, check if there is a paid order for this course
        const [order] = await db.select()
            .from(schema.orders)
            .where(
                and(
                    eq(schema.orders.userId, userId),
                    eq(schema.orders.courseId, courseId),
                    eq(schema.orders.status, "completed")
                )
            )
            .limit(1);

        if (order) {
            // Implicitly create an enrollment if it was missing? 
            // Better to handle this at order completion time, but good fallback.
            await db.insert(schema.enrollments).values({
                userId,
                courseId,
            }).onConflictDoNothing();

            return res.json({ allowed: true });
        }

        return res.json({ allowed: false, reason: "no_active_enrollment" });
    } catch (error) {
        console.error("Access check error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
