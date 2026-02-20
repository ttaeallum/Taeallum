import { Router, type Request, type Response } from "express";
import { requireAuth } from "./auth";
import { payTabsService } from "../services/paytabs";
import { db } from "../db";
import { users, subscriptions, orders } from "../db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Initiate Payment
router.post("/initiate", requireAuth, async (req: Request, res: Response) => {
    try {
        // Cast req to any to access user populated by requireAuth
        const user = (req as any).user;
        const { planId } = req.body;

        // 1. Determine Amount & Currency
        // For now, hardcoded for AI Plan
        // $10 USD = ~7.10 JOD
        const amount = 7.10;
        const currency = "JOD";
        const description = "AI Assistant Subscription";
        // Short cart ID to respect length limits if any
        const cartId = `ord_${Date.now()}_${user.id.substring(0, 4)}`;

        // Use environmental variable for app URL or fallback
        const baseUrl = process.env.APP_URL || "https://taallm.com";
        const callbackUrl = `${baseUrl}/api/paytabs/callback`;
        const returnUrl = `${baseUrl}/paytabs/return`; // Frontend page

        // 2. Initiate via Service
        const result = await payTabsService.createPaymentPage({
            cartId,
            cartDescription: description,
            cartCurrency: currency,
            cartAmount: amount,
            callback: callbackUrl,
            return: returnUrl,
            customerDetails: {
                name: user.fullName || "Customer",
                email: user.email,
                ip: req.ip,
                country: "JO",
                street: "Amman", // Default fallback
                city: "Amman",
                state: "Amman",
                zip: "11111"
            }
        });

        // 3. Create Pending Order in DB
        // Ensure result.tran_ref exists
        if (!result.tran_ref) {
            throw new Error("No transaction reference returned from PayTabs");
        }

        await db.insert(orders).values({
            userId: user.id,
            planId: planId || "pro",
            amount: amount.toString(),
            status: "pending",
            paymentMethod: "paytabs",
            paymentId: result.tran_ref,
            adminNotes: `Initial Transaction Ref: ${result.tran_ref}`
        });

        res.json({ redirectUrl: result.redirect_url });

    } catch (error: any) {
        console.error("PayTabs Init Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Callback (Webhook) - Server to Server
router.post("/callback", async (req: Request, res: Response) => {
    try {
        const data = req.body;
        console.log("[PayTabs] Callback Received:", data);

        const tranRef = data.tran_ref;
        const paymentResult = data.payment_result?.response_status; // "A" = Authorized/Success

        if (paymentResult === "A") {
            // Find Order by Payment ID (tran_ref)
            const [order] = await db.select().from(orders).where(eq(orders.paymentId, tranRef)).limit(1);

            if (order && order.status !== "completed") {
                // 1. Update Order Status
                await db.update(orders)
                    .set({ status: "completed" })
                    .where(eq(orders.id, order.id));

                // 2. Grant Subscription
                // Check if active subscription exists
                const [existingSub] = await db.select().from(subscriptions)
                    .where(eq(subscriptions.userId, order.userId))
                    .limit(1);

                const now = new Date();
                const nextMonth = new Date();
                nextMonth.setMonth(now.getMonth() + 1);

                if (existingSub) {
                    await db.update(subscriptions).set({
                        status: "active",
                        plan: order.planId || "pro",
                        currentPeriodEnd: nextMonth,
                        updatedAt: now
                    }).where(eq(subscriptions.id, existingSub.id));
                } else {
                    await db.insert(subscriptions).values({
                        userId: order.userId,
                        plan: order.planId || "pro",
                        status: "active",
                        currentPeriodStart: now,
                        currentPeriodEnd: nextMonth,
                        amount: order.amount
                    });
                }
                console.log(`[PayTabs] User ${order.userId} upgraded successfully.`);
            }
        }

        // Always return 200 to PayTabs
        res.status(200).send("OK");
    } catch (error) {
        console.error("PayTabs Callback Error:", error);
        res.status(500).send("Error");
    }
});

// Verify Transaction on Return (Called by Frontend or Backend Redirect)
router.post("/verify", requireAuth, async (req: Request, res: Response) => {
    try {
        const { tranRef } = req.body;
        if (!tranRef) return res.status(400).json({ message: "No transaction ref" });

        // 1. Verify with PayTabs API
        const details = await payTabsService.verifyPayment(tranRef);

        if (details.payment_result?.response_status === "A") {
            // 2. Ensure DB is synced (in case callback missed)
            const [order] = await db.select().from(orders).where(eq(orders.paymentId, tranRef)).limit(1);
            if (order && order.status !== "completed") {
                await db.update(orders).set({ status: "completed" }).where(eq(orders.id, order.id));

                // Grant Subscription Logic (Duplicated for safety)
                const now = new Date();
                const nextMonth = new Date();
                nextMonth.setMonth(now.getMonth() + 1);

                const [existingSub] = await db.select().from(subscriptions)
                    .where(eq(subscriptions.userId, order.userId))
                    .limit(1);

                if (existingSub) {
                    await db.update(subscriptions).set({
                        status: "active",
                        currentPeriodEnd: nextMonth
                    }).where(eq(subscriptions.id, existingSub.id));
                } else {
                    await db.insert(subscriptions).values({
                        userId: order.userId,
                        plan: order.planId || "pro",
                        status: "active",
                        currentPeriodStart: now,
                        currentPeriodEnd: nextMonth,
                        amount: order.amount
                    });
                }
                console.log(`[PayTabs] User ${order.userId} verified and upgraded.`);
            }

            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            res.status(400).json({ success: false, message: "Payment failed or pending" });
        }

    } catch (error: any) {
        console.error("PayTabs Verification Error:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
