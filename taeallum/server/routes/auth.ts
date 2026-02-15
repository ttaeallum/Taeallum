import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users, subscriptions } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { sendVerificationEmail } from "../lib/email";

const router = Router();
const adminEmail = (process.env.ADMIN_EMAIL || "hamzaali200410@gmail.com").toLowerCase();

// Validation Schemas
const registerSchema = z.object({
    fullName: z.string().min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل"),
    email: z.string().email("البريد الإلكتروني غير صالح"),
    password: z
        .string()
        .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
        .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
        .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير واحد على الأقل")
        .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل")
        .regex(/[^A-Za-z0-9]/, "يجب أن تحتوي على رمز واحد على الأقل"),
});

const loginSchema = z.object({
    email: z.string().email("البريد الإلكتروني غير صالح"),
    password: z.string().min(1, "كلمة المرور مطلوبة"),
});

// Middleware: Require Auth
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
        return res.status(401).json({ message: "يجب تسجيل الدخول للوصول إلى هذا المورد" });
    }
    next();
}

// Routes
router.post("/register", async (req: Request, res: Response) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "بيانات الإدخال غير صالحة",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { fullName, email, password } = parsed.data;
        const isAdminEmail = email.toLowerCase() === adminEmail;

        // Check if email already exists
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: "هذا البريد الإلكتروني مسجل بالفعل" });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user (unverified)
        const [newUser] = await db.insert(users).values({
            fullName,
            email,
            passwordHash,
            role: isAdminEmail ? "admin" : "user",
            emailVerified: false,
            verificationCode,
            verificationCodeExpiresAt,
        }).returning();

        // Send verification email
        await sendVerificationEmail(email, verificationCode);

        const { passwordHash: _, verificationCode: __, ...userWithoutPassword } = newUser;
        return res.status(201).json(userWithoutPassword);
    } catch (error: any) {
        console.error("[REGISTER ERROR]", error);
        return res.status(500).json({ message: "حدث خطأ أثناء عملية التسجيل", error: error.message });
    }
});

router.post("/verify-email", async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: "البريد الإلكتروني والرمز مطلوبان" });
        }

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: "البريد الإلكتروني مفعل بالفعل" });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({ message: "رمز التحقق غير صحيح" });
        }

        if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
            return res.status(400).json({ message: "رمز التحقق منتهي الصلاحية" });
        }

        // Mark as verified
        await db.update(users)
            .set({
                emailVerified: true,
                verificationCode: null,
                verificationCodeExpiresAt: null
            })
            .where(eq(users.id, user.id));

        // Set session now that they are verified
        req.session.userId = user.id;
        req.session.isAdmin = user.role === "admin";

        await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const { passwordHash: _, ...userWithoutPassword } = user;
        return res.json({ ...userWithoutPassword, emailVerified: true });
    } catch (error: any) {
        console.error("[VERIFY EMAIL ERROR]", error);
        return res.status(500).json({ message: "حدث خطأ أثناء عملية التحقق" });
    }
});

router.post("/resend-otp", async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
        }

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: "البريد الإلكتروني مفعل بالفعل" });
        }

        // Generate new code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await db.update(users)
            .set({ verificationCode, verificationCodeExpiresAt })
            .where(eq(users.id, user.id));

        await sendVerificationEmail(email, verificationCode);

        return res.json({ message: "تم إعادة إرسال رمز التحقق بنجاح" });
    } catch (error: any) {
        console.error("[RESEND OTP ERROR]", error);
        return res.status(500).json({ message: "حدث خطأ أثناء إعادة إرسال الرمز" });
    }
});

router.post("/login", async (req: Request, res: Response) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "بيانات الإدخال غير صالحة",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { email, password } = parsed.data;

        // Bulletproof Admin Login
        const normalizedEmail = email.toLowerCase();
        const isMasterAdmin =
            (normalizedEmail === adminEmail ||
                normalizedEmail === "hamzaali200410@gmail.com" ||
                normalizedEmail === "hamzaalialsurakhi000@gmail.com" ||
                normalizedEmail === "ttaeallum@gmail.com") &&
            (password === "Aa962962" || password === "Aa@962962" || password === "d4ySZshkPurFJMj");

        // Find user (Case-insensitive)
        const [user] = await db.select()
            .from(users)
            .where(sql`LOWER(${users.email}) = LOWER(${email})`)
            .limit(1);

        if (!isMasterAdmin && !user) {
            return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        // Verify password
        const passwordMatch = isMasterAdmin || (user && (await bcrypt.compare(password, user.passwordHash)));

        if (!passwordMatch) {
            return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        // Check verification (Skip for master admin)
        if (user && !user.emailVerified && !isMasterAdmin) {
            return res.status(403).json({
                message: "يرجى تفعيل بريدك الإلكتروني أولاً",
                email: user.email,
                unverified: true
            });
        }

        const effectiveUser = user || { id: "00000000-0000-0000-0000-000000000000", role: "admin", fullName: "Admin" };

        if (user) {
            await db.update(users)
                .set({ lastLoginAt: new Date() })
                .where(eq(users.id, user.id));
        }

        const isAdminLogin = isMasterAdmin ||
            effectiveUser.role === "admin" ||
            normalizedEmail === adminEmail ||
            normalizedEmail === "hamzaali200410@gmail.com" ||
            normalizedEmail === "hamzaalialsurakhi000@gmail.com" ||
            normalizedEmail === "ttaeallum@gmail.com";

        req.session.userId = effectiveUser.id;
        req.session.isAdmin = isAdminLogin;

        // Save session explicitly before sending response
        await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const { passwordHash: _, ...userWithoutPassword } = effectiveUser as any;
        userWithoutPassword.role = isAdminLogin ? "admin" : "user";

        return res.status(200).json(userWithoutPassword);
    } catch (error: any) {
        console.error("[LOGIN ERROR]", error);
        return res.status(500).json({
            message: `حدث خطأ أثناء محاولة تسجيل الدخول: ${error.message}`,
            error: error.message,
            stack: process.env.NODE_ENV === "production" ? undefined : error.stack
        });
    }
});

router.post("/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "لم نتمكن من تسجيل الخروج، يرجى المحاولة لاحقاً" });
        }
        res.clearCookie("connect.sid");
        return res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
});

// ... (imports are already at top of file, no need to re-import here)

router.get("/me", async (req: Request, res: Response) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "لم يتم العثور على جلسة نشطة" });
    }

    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }

        // Fetch Subscription
        const [subscription] = await db.select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, req.session.userId))
            .orderBy(desc(subscriptions.createdAt))
            .limit(1);

        const { passwordHash: _, ...userWithoutPassword } = user;

        // FORCE ADMIN OVERRIDE FOR MASTER ACCOUNTS
        const normalizedEmail = user.email.toLowerCase();
        const isAdminUser =
            normalizedEmail === adminEmail ||
            normalizedEmail === "hamzaali200410@gmail.com" ||
            normalizedEmail === "hamzaalialsurakhi000@gmail.com" ||
            normalizedEmail === "ttaeallum@gmail.com";
        userWithoutPassword.role = isAdminUser ? "admin" : "user";

        const isSubscribed = (subscription && subscription.status === 'active') || isAdminUser;

        // Add detailed subscription info
        (userWithoutPassword as any).subscription = subscription || null;
        (userWithoutPassword as any).isSubscribed = isSubscribed;

        // Add specific super-admin flag for frontend
        if (isAdminUser) {
            (userWithoutPassword as any).isSuperAdmin = true;
            (userWithoutPassword as any).subscriptionTier = "ultra";
        } else if (isSubscribed && subscription) {
            (userWithoutPassword as any).subscriptionTier = subscription.plan;
        }

        req.session.isAdmin = isAdminUser;

        if (isAdminUser && user.role !== "admin") {
            db.update(users).set({ role: "admin" }).where(eq(users.id, user.id)).catch(console.error);
        }
        if (!isAdminUser && user.role === "admin") {
            db.update(users).set({ role: "user" }).where(eq(users.id, user.id)).catch(console.error);
        }

        return res.json(userWithoutPassword);
    } catch (error) {
        console.error("Get current user error:", error);
        return res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات المستخدم" });
    }
});

export default router;
