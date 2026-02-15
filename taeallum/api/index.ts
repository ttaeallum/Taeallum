import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import memorystore from "memorystore";
const MemoryStore = memorystore(session);

// Type extensions for session
import "../server/types/session.d.ts";

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
import aiEngineRouter from "../server/routes/ai-engine";
import { getDbConfig, db } from "../server/db";
import { sql } from "drizzle-orm";

const app = express();

app.use(express.json({
    verify: (req: any, _res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

app.use(session({
    store: new (MemoryStore as any)({ checkPeriod: 86400000 }),
    secret: process.env.SESSION_SECRET || "hamza-secret-2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));

// Basic request logger
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

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
app.use("/api/ai-engine", aiEngineRouter);

app.get("/api/status", (req: Request, res: Response) => {
    res.json({
        status: "alive",
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        db_config: getDbConfig()
    });
});

app.get("/api/health/db", async (req: Request, res: Response) => {
    try {
        await db.execute(sql`select 1`);
        res.json({ ok: true, status: "connected", db: getDbConfig() });
    } catch (e: any) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("API ERROR:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
});

export default app;
