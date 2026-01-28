import express from "express";
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

app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: process.env.SESSION_SECRET || "hamza-secret-2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: "none",
        httpOnly: true,
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
    res.json({ message: "TAEALLUM FULL API IS LIVE!", time: new Date().toISOString() });
});

app.get("/api/health/db", async (req, res) => {
    try {
        await db.execute(sql`select 1`);
        res.json({ ok: true, status: "connected" });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e), config: getDbConfig() });
    }
});

export default app;
