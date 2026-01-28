import { Router } from "express";
import Stripe from "stripe";
import { requireAuth } from "./auth";
import { db } from "../db";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-01-27.acacia" as any,
});

const router = Router();

router.post("/create-checkout-session", requireAuth, async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.session.userId;

        if (!courseId) {
            return res.status(400).json({ message: "Course ID is required" });
        }

        let title = "اشتراك في المنصة";
        let amount = 4500; // 45.00 SAR

        if (courseId !== "subscription") {
            const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).limit(1);
            if (!course) {
                return res.status(404).json({ message: "Course not found" });
            }
            title = `دورة: ${course.title}`;
            amount = Math.round(Number(course.price) * 100);
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "sar",
                        product_data: {
                            name: title,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/courses`,
            metadata: {
                userId: userId!,
                courseId,
            },
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe Session Error:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
