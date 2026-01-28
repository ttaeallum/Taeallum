import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const router = Router();
const adminEmail = (process.env.ADMIN_EMAIL || "hamzali200410@gmail.com").toLowerCase();

// Validation Schemas
const registerSchema = z.object({
    fullName: z.string().min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل"),
    email: z.string().email("البريد الإلكتروني غير صالح"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
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
router.post("/register", async (req, res) => {
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

        // Create user
        const [newUser] = await db.insert(users).values({
            fullName,
            email,
            passwordHash,
            role: isAdminEmail ? "admin" : "user",
        }).returning();

        // Set session
        req.session.userId = newUser.id;
        req.session.isAdmin = isAdminEmail;
        
        // Save session explicitly
        await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error("Register - Session save error:", err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const { passwordHash: _, ...userWithoutPassword } = newUser;
        return res.status(201).json({
            ...userWithoutPassword,
            sessionId: req.sessionID
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "حدث خطأ أثناء عملية التسجيل" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "بيانات الإدخال غير صالحة",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { email, password } = parsed.data;

        // Find user
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
            return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        // Update last login (optional but recommended)
        await db.update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));

        const isAdminEmail = user.email.toLowerCase() === adminEmail;
        if (isAdminEmail && user.role !== "admin") {
            await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
            user.role = "admin";
        }
        if (!isAdminEmail && user.role === "admin") {
            await db.update(users).set({ role: "user" }).where(eq(users.id, user.id));
            user.role = "user";
        }

        // Set session data
        req.session.userId = user.id;
        req.session.isAdmin = isAdminEmail;
        
        // Save session explicitly before sending response
        await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error("Login - Session save error:", err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const { passwordHash: _, ...userWithoutPassword } = user;
        
        // إرسال بيانات المستخدم مع رسالة نجاح
        return res.status(200).json({
            ...userWithoutPassword,
            sessionSaved: true,
            sessionId: req.sessionID
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "حدث خطأ أثناء محاولة تسجيل الدخول" });
    }
});

router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "لم نتمكن من تسجيل الخروج، يرجى المحاولة لاحقاً" });
        }
        res.clearCookie("connect.sid");
        return res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
});

router.get("/me", async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "لم يتم العثور على جلسة نشطة" });
    }

    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }

        const { passwordHash: _, ...userWithoutPassword } = user;

        // FORCE ADMIN OVERRIDE FOR HAMZA
        const isAdminEmail = user.email.toLowerCase() === adminEmail;
        userWithoutPassword.role = isAdminEmail ? "admin" : "user";
        req.session.isAdmin = isAdminEmail;
        if (isAdminEmail && user.role !== "admin") {
            db.update(users).set({ role: "admin" }).where(eq(users.id, user.id)).catch(console.error);
        }
        if (!isAdminEmail && user.role === "admin") {
            db.update(users).set({ role: "user" }).where(eq(users.id, user.id)).catch(console.error);
        }

        return res.json(userWithoutPassword);
    } catch (error) {
        console.error("Get current user error:", error);
        return res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات المستخدم" });
    }
});

export default router;
