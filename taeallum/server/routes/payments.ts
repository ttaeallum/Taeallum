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

        let title = "اشتراك المساعد الذكي (Smart AI)";
        let amount = 3750; // $10 approx in SAR (cents) - actually let's use USD if possible or fix SAR.
        // The user said 10 dollars. $10 * 3.75 = 37.5 SAR. In cents it is 3750.
        const currency = "usd";
        amount = 1000; // $10.00 USD

        if (planId === "pro") {
            title = "اشتراك منصة تعلّم الشهري";
            amount = 5000; // $50.00 USD
        } else {
            title = "اشتراك منصة تعلّم الشهري";
            amount = 5000;
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
                planId: planId, // This will reach the webhook
                type: "subscription"
            },
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe Session Error:", error);
        res.status(500).json({ message: error.message });
    }
});

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET_KEY = process.env.PAYPAL_SECRET_KEY;
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const paypalBaseUrl = PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function generatePayPalAccessToken() {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
        throw new Error("PayPal API keys not configured");
    }
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET_KEY}`).toString("base64");
    const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error_description || "Failed to generate PayPal Auth Token");
    }
    return data.access_token;
}

router.post("/paypal/create-order", requireAuth, async (req: Request, res: Response) => {
    try {
        const { courseId } = req.body; 
        const planId = req.body.planId || courseId; 
        const userId = req.session.userId;
        
        console.log(`[PAYPAL] Creating order for user ${userId}, plan ${planId}`);

        if (!planId) {
            console.error("[PAYPAL] Plan ID missing");
            return res.status(400).json({ message: "Plan ID is required" });
        }

        let title = "اشتراك المساعد الذكي (Smart AI)";
        let amount = "10.00"; // USD

        if (planId === "pro" || planId === "subscription") {
            title = "اشتراك منصة تعلّم الشهري";
            amount = "50.00"; // USD
        } else if (planId === "subscription_discounted") {
            title = "اشتراك منصة تعلّم الشهري (خصم)";
            amount = "35.00"; // USD
        }

        console.log(`[PAYPAL] Order details: title="${title}", amount="${amount}"`);

        const accessToken = await generatePayPalAccessToken();
        
        const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [
                    {
                        custom_id: `${userId}|${planId}`,
                        description: title,
                        amount: {
                            currency_code: "USD",
                            value: amount,
                        },
                    },
                ],
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to create PayPal order");
        }
        res.json({ id: data.id });
    } catch (error: any) {
        console.error("[PAYPAL ERROR] Create Order:", error.message);
        res.status(500).json({ message: error.message });
    }
});

router.post("/paypal/capture-order", requireAuth, async (req: Request, res: Response) => {
    try {
        const { orderID } = req.body;
        const accessToken = await generatePayPalAccessToken();

        const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${orderID}/capture`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to capture PayPal order");
        }
        
        // At this point payment is captured successfully
        // Depending on webhook setup, we might optionally update user subscription here immediately
        res.json(data);
    } catch (error: any) {
        console.error("PayPal Capture Order Error:", error);
        res.status(500).json({ message: error.message });
    }
});


export default router;
