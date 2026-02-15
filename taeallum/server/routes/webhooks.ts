import { Router, type Request, type Response } from "express";
import { db } from "../db";
import * as schema from "../db/schema";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";

const stripeKey = process.env.STRIPEPRIVATE || process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
    ? new Stripe(stripeKey, {
        apiVersion: "2025-01-27.acacia" as any,
    })
    : null;

const router = Router();

router.post("/stripe", async (req: Request & { rawBody?: Buffer }, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
        if (!webhookSecret || !req.rawBody || !stripe) {
            // Fallback for development if secret not set, but unsafe for production
            event = req.body;
        } else {
            event = stripe.webhooks.constructEvent(req.rawBody as Buffer, sig, webhookSecret);
        }
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        const courseId = session.metadata?.courseId;

        if (userId && courseId) {
            console.log(`Payment confirmed for user ${userId} and course ${courseId}`);

            try {
                // 1. Create or update the order
                await db.insert(schema.orders).values({
                    userId,
                    courseId,
                    amount: ((session.amount_total || 0) / 100).toString(),
                    status: "completed",
                    paymentId: session.id,
                });

                // 2. Create the enrollment
                // Case for 'subscription' - we might need to handle specific 'subscription' courseId
                if (courseId === "subscription") {
                    // Logic for site-wide subscription could go here
                    // For now we'll just log it
                    console.log("Global subscription activated for user", userId);
                } else {
                    try {
                        await db.insert(schema.enrollments).values({
                            userId,
                            courseId,
                        });
                    } catch (err) {
                        console.log(`[WEBHOOK] Enrollment already exists for user ${userId}`);
                    }
                }

            } catch (dbErr) {
                console.error("Database error during webhook:", dbErr);
            }
        }
    }

    res.json({ received: true });
});

export default router;
