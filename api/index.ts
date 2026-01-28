import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import memorystore from "memorystore";
const MemoryStore = memorystore(session);

// Routers
import authRouter from "../server/routes/auth";
import adminAuthRouter from "../server/routes/admin-auth";
import adminRouter from "../server/routes/admin";
import publicCoursesRouter from "../server/routes/public-courses";
import accessRouter from "../server/routes/access";
import webhooksRouter from "../server/routes/webhooks";
import paymentsRouter from "../server/routes/payments";
import courseContentRouter from "../server/routes/course-content";
import chatbotRouter from "../server/routes/chatbot";
import { getDbConfig, db, pool } from "../server/db";
import { sql } from "drizzle-orm";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

// Super-Compatible Session Config
app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: process.env.SESSION_SECRET || "hamza-secret-2026",
    resave: true, // Force session save
    saveUninitialized: true,
    cookie: {
        secure: true,
        sameSite: "none", // Essential for cross-site requests if they happen
        httpOnly: false, // Allow client access if needed (debugging)
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin-panel", adminRouter);
app.use("/api/courses", publicCoursesRouter);
app.use("/api/access", accessRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/course-content", courseContentRouter);
app.use("/api/chatbot", chatbotRouter);

app.get("/api/hello", (req, res) => {
    res.json({ message: "TAEALLUM ENGINE RESPONDING", version: "6.5" });
});

// SELF-HEALING DB CHECK
app.get("/api/health/db", async (req, res) => {
    try {
        // Test query
        await db.execute(sql`select 1`);

        // Check if users table exists
        const tableCheck = await pool.query("SELECT to_regclass('public.users') as exists");
        const exists = !!tableCheck.rows[0].exists;

        res.json({
            ok: true,
            status: "connected",
            usersTableExists: exists,
            config: getDbConfig()
        });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

export default app;
