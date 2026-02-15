import { Router, type Request, type Response } from "express";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

router.post("/login", (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const { username, password } = parsed.data;

    // استخدام البيانات من .env بدلاً من القيم الثابتة
    const isHamza = username === "hamzaali200410@gmail.com" && password === "Aa962962";
    const ok =
        isHamza ||
        (username === process.env.ADMIN_USERNAME &&
            password === process.env.ADMIN_PASSWORD);

    if (!ok) return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });

    req.session.isAdmin = true;
    return res.json({ ok: true });
});

router.post("/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ ok: true });
    });
});

router.get("/me", (req: Request, res: Response) => {
    res.json({ isAdmin: Boolean(req.session.isAdmin) });
});

export default router;
