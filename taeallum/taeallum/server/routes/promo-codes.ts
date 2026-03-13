import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { promoCodes, promoCodeUsages, users } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /api/promo-codes — Public: validate a promo code
router.get("/validate/:code", async (req: Request, res: Response) => {
    try {
        const code = String(req.params.code).toUpperCase().trim();
        const promo = await db.query.promoCodes.findFirst({
            where: eq(promoCodes.code, code)
        });

        if (!promo) {
            return res.status(404).json({ valid: false, message: "كود الخصم غير موجود" });
        }
        if (!promo.isActive) {
            return res.status(400).json({ valid: false, message: "كود الخصم غير فعّال حالياً" });
        }
        if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
            return res.status(400).json({ valid: false, message: "انتهت صلاحية كود الخصم" });
        }
        if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
            return res.status(400).json({ valid: false, message: "تجاوز كود الخصم الحد الأقصى للاستخدام" });
        }

        return res.json({
            valid: true,
            code: promo.code,
            discountPercent: promo.discountPercent,
            discountAmount: promo.discountAmount,
            message: `تم تطبيق خصم ${promo.discountPercent}%!`
        });
    } catch (error) {
        console.error("Error validating promo code:", error);
        res.status(500).json({ valid: false, message: "خطأ في التحقق من الكود" });
    }
});

// POST /api/promo-codes/use — Record promo code usage after payment
router.post("/use", async (req: Request, res: Response) => {
    try {
        const { code, userId, pricePaid, originalPrice } = req.body;
        if (!code || !userId || pricePaid === undefined || originalPrice === undefined) {
            return res.status(400).json({ message: "بيانات ناقصة" });
        }

        const promo = await db.query.promoCodes.findFirst({
            where: eq(promoCodes.code, code.toUpperCase().trim())
        });
        if (!promo) return res.status(404).json({ message: "كود غير موجود" });

        // Record usage
        await db.insert(promoCodeUsages).values({
            promoCodeId: promo.id,
            userId,
            pricePaid: String(pricePaid),
            originalPrice: String(originalPrice),
        });

        // Increment usage count
        await db.update(promoCodes)
            .set({ usageCount: promo.usageCount + 1, updatedAt: new Date() })
            .where(eq(promoCodes.id, promo.id));

        res.json({ success: true });
    } catch (error) {
        console.error("Error recording promo usage:", error);
        res.status(500).json({ message: "خطأ في تسجيل الاستخدام" });
    }
});

// === Admin Routes ===

// GET /api/promo-codes/admin — List all promo codes
router.get("/admin", async (req: Request, res: Response) => {
    try {
        const codes = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
        res.json(codes);
    } catch (error) {
        console.error("Error fetching promo codes:", error);
        res.status(500).json({ message: "خطأ في جلب أكواد الخصم" });
    }
});

// GET /api/promo-codes/admin/:id/usages — Get who used a specific code
router.get("/admin/:id/usages", async (req: Request, res: Response) => {
    try {
        const usages = await db
            .select({
                id: promoCodeUsages.id,
                userId: promoCodeUsages.userId,
                userName: users.fullName,
                userEmail: users.email,
                pricePaid: promoCodeUsages.pricePaid,
                originalPrice: promoCodeUsages.originalPrice,
                usedAt: promoCodeUsages.usedAt,
            })
            .from(promoCodeUsages)
            .leftJoin(users, eq(users.id, promoCodeUsages.userId))
            .where(eq(promoCodeUsages.promoCodeId, String(req.params.id)))
            .orderBy(desc(promoCodeUsages.usedAt));

        res.json(usages);
    } catch (error) {
        console.error("Error fetching promo usages:", error);
        res.status(500).json({ message: "خطأ في جلب بيانات الاستخدام" });
    }
});

// POST /api/promo-codes/admin — Create a promo code
router.post("/admin", async (req: Request, res: Response) => {
    try {
        const { code, discountPercent, usageLimit, expiresAt, description } = req.body;
        if (!code || discountPercent === undefined) {
            return res.status(400).json({ message: "الكود ونسبة الخصم مطلوبان" });
        }
        const [created] = await db.insert(promoCodes).values({
            code: code.toUpperCase().trim(),
            discountPercent: Number(discountPercent),
            isActive: true,
            usageLimit: usageLimit ? Number(usageLimit) : null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            description: description || null,
        }).returning();
        res.json(created);
    } catch (error: any) {
        if (error.message?.includes("unique")) {
            return res.status(409).json({ message: "كود الخصم موجود مسبقاً" });
        }
        console.error("Error creating promo code:", error);
        res.status(500).json({ message: "خطأ في إنشاء كود الخصم" });
    }
});

// PATCH /api/promo-codes/admin/:id — Update (toggle active, change discount, etc.)
router.patch("/admin/:id", async (req: Request, res: Response) => {
    try {
        const { isActive, discountPercent, code, usageLimit, expiresAt, description } = req.body;
        const updates: any = { updatedAt: new Date() };
        if (isActive !== undefined) updates.isActive = isActive;
        if (discountPercent !== undefined) updates.discountPercent = Number(discountPercent);
        if (code !== undefined) updates.code = code.toUpperCase().trim();
        if (usageLimit !== undefined) updates.usageLimit = usageLimit ? Number(usageLimit) : null;
        if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
        if (description !== undefined) updates.description = description;

        const [updated] = await db.update(promoCodes)
            .set(updates)
            .where(eq(promoCodes.id, String(req.params.id)))
            .returning();

        res.json(updated);
    } catch (error) {
        console.error("Error updating promo code:", error);
        res.status(500).json({ message: "خطأ في تحديث كود الخصم" });
    }
});

// DELETE /api/promo-codes/admin/:id — Delete a promo code
router.delete("/admin/:id", async (req: Request, res: Response) => {
    try {
        await db.delete(promoCodes).where(eq(promoCodes.id, String(req.params.id)));
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting promo code:", error);
        res.status(500).json({ message: "خطأ في حذف كود الخصم" });
    }
});

export default router;
