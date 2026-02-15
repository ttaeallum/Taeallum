import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import { requireAuth } from "./auth";
import { db } from "../db";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

const stripeKey = process.env.STRIPEPRIVATE || process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
    ? new Stripe(stripeKey, {
        apiVersion: "2025-01-27.acacia" as any,
    })
    : null;

const router = Router();

router.post("/create-checkout-session", requireAuth, async (req: Request, res: Response) => {
    try {
        const { planId } = req.body; // 'personal', 'pro', or 'ultra'
        const userId = req.session.userId;

        if (!planId) {
            return res.status(400).json({ message: "Plan ID is required" });
        }

        let title = "اشتراك حمزة الذكي (Hamza Smart AI)";
        let amount = 3750; // $10 approx in SAR (cents) - actually let's use USD if possible or fix SAR.
        // The user said 10 dollars. $10 * 3.75 = 37.5 SAR. In cents it is 3750.
        const currency = "usd";
        amount = 1000; // $10.00 USD

        if (planId === "pro") {
            title = "اشتراك حمزة الذكي (Hamza Smart AI Assistant)";
            amount = 1000; // $10.00 USD
        } else {
            // Default to Pro if they try anything else, as it's the only paid plan
            title = "اشتراك حمزة الذكي (Hamza Smart AI Assistant)";
            amount = 1000;
        }

        if (!stripe) {
            return res.status(400).json({ message: "Stripe is not configured" });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: title,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
            cancel_url: `${req.headers.origin}/ai-pricing`,
            metadata: {
                userId: userId!,
                planId,
            },
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe Session Error:", error);
        res.status(500).json({ message: error.message });
    }
});


export default router;
