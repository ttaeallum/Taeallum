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
        const planId = session.metadata?.planId;
        const type = session.metadata?.type;

        if (userId && (planId || type === "subscription")) {
            console.log(`Payment confirmed for user ${userId}, Plan: ${planId}`);

            try {
                // 1. Create the order
                await db.insert(schema.orders).values({
                    userId,
                    planId: planId || "pro",
                    amount: ((session.amount_total || 0) / 100).toString(),
                    status: "completed",
                    paymentId: session.id,
                });

                // 2. Activate Subscription
                // Set end date to 30 days from now
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30);

                await db.insert(schema.subscriptions).values({
                    userId,
                    plan: planId || "pro",
                    status: "active",
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    currentPeriodStart: startDate,
                    currentPeriodEnd: endDate,
                    amount: ((session.amount_total || 0) / 100).toString(),
                    currency: session.currency || "usd",
                });

                console.log(`Subscription activated for user ${userId}`);

            } catch (dbErr) {
                console.error("Database error during webhook:", dbErr);
            }
        }
    }

    res.json({ received: true });
});

export default router;
