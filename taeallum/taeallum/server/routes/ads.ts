import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { ads, users, adminAuditLogs } from "../db/schema";
import { eq } from "drizzle-orm";

const adminEmail = (process.env.ADMIN_EMAIL || "hamzaali200410@gmail.com").toLowerCase();

// Helper: Log Audit
async function logAudit(action: string, entityType: string, entityId?: string, details?: any) {
    try {
        await db.insert(adminAuditLogs).values({
            adminId: adminEmail,
            action,
            entityType,
            entityId,
            details,
        });
    } catch (err) {
        console.error("Audit log error:", err);
    }
}

const router = Router();

// Helper: check if the current session user is admin
async function isAdminSession(req: Request): Promise<boolean> {
    // Fast path: session flag
    if (req.session?.isAdmin) return true;

    // Fallback: check user role from DB via session userId
    const userId = (req.session as any)?.userId;
    if (!userId) return false;

    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (user && user.role === "admin") {
            req.session.isAdmin = true; // Cache for next requests
            return true;
        }
    } catch (e) {
        console.error("Admin check failed:", e);
    }
    return false;
}

// 1. Get Ad Config (Public)
router.get("/:location", async (req: Request, res: Response) => {
    try {
        const location = req.params.location as string;
        const [ad] = await db.select().from(ads).where(eq(ads.location, location)).limit(1);

        if (!ad) {
            return res.json({
                location,
                isActive: false,
                type: 'image',
                headline: '',
                description: '',
                primaryText: '',
                primaryLink: '',
                mediaUrl: '',
                scriptCode: ''
            });
        }

        res.json(ad);
    } catch (error) {
        console.error("Get Ad Error:", error);
        res.status(500).json({ message: "Failed to fetch ad config" });
    }
});

// 2. Update Ad Config (Admin Protected)
router.post("/:location", async (req: Request, res: Response) => {
    try {
        const admin = await isAdminSession(req);
        if (!admin) {
            console.log("[Ads] POST rejected - not admin. Session:", JSON.stringify(req.session));
            return res.status(403).json({ message: "Admin access required" });
        }

        const location = req.params.location as string;
        const { isActive, type, headline, description, primaryText, primaryLink, mediaUrl, scriptCode } = req.body;

        console.log(`[Ads] Saving ad for location="${location}", isActive=${isActive}, type=${type}`);

        // Check if ad exists
        const [existing] = await db.select().from(ads).where(eq(ads.location, location)).limit(1);

        if (existing) {
            const [updated] = await db.update(ads)
                .set({
                    isActive: Boolean(isActive),
                    type: String(type || "image"),
                    headline: String(headline || ""),
                    description: String(description || ""),
                    primaryText: String(primaryText || ""),
                    primaryLink: String(primaryLink || ""),
                    mediaUrl: String(mediaUrl || ""),
                    scriptCode: String(scriptCode || ""),
                    updatedAt: new Date()
                })
                .where(eq(ads.location, location))
                .returning();
            console.log("[Ads] Updated successfully:", updated?.id || updated?.location);
            await logAudit("UPDATE", "Ad", updated.id, updated);
            res.json(updated);
        } else {
            const [created] = await db.insert(ads)
                .values({
                    location: location as string,
                    isActive: Boolean(isActive),
                    type: String(type || "image"),
                    headline: String(headline || ""),
                    description: String(description || ""),
                    primaryText: String(primaryText || ""),
                    primaryLink: String(primaryLink || ""),
                    mediaUrl: String(mediaUrl || ""),
                    scriptCode: String(scriptCode || ""),
                })
                .returning();
            console.log("[Ads] Created successfully:", created?.id || created?.location);
            await logAudit("CREATE", "Ad", created.id, created);
            res.json(created);
        }
    } catch (error) {
        console.error("Update Ad Error:", error);
        res.status(500).json({ message: "Failed to update ad config", error: String(error) });
    }
});

// 3. Get All Ads (Admin Protected)
router.get("/all/list", async (req: Request, res: Response) => {
    try {
        const admin = await isAdminSession(req);
        if (!admin) return res.status(403).json({ message: "Admin access required" });

        const allAds = await db.select().from(ads).orderBy(ads.location);
        res.json(allAds);
    } catch (error) {
        console.error("Get All Ads Error:", error);
        res.status(500).json({ message: "Failed to fetch ads list" });
    }
});

// 4. Delete Ad (Admin Protected)
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const admin = await isAdminSession(req);
        if (!admin) return res.status(403).json({ message: "Admin access required" });

        const id = req.params.id as string;
        const [deleted] = await db.delete(ads).where(eq(ads.id, id)).returning();

        if (!deleted) {
            return res.status(404).json({ message: "Ad not found" });
        }

        console.log(`[Ads] Deleted successfully: ${id} (${deleted.location})`);
        await logAudit("DELETE", "Ad", id, { location: deleted.location });
        res.json({ success: true, deleted });
    } catch (error) {
        console.error("Delete Ad Error:", error);
        res.status(500).json({ message: "Failed to delete ad" });
    }
});

export default router;
