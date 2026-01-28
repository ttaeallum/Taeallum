import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import memorystore from "memorystore";
const MemoryStore = memorystore(session);

import adminAuthRouter from "./routes/admin-auth";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import publicCoursesRouter from "./routes/public-courses";
import accessRouter from "./routes/access";
import webhooksRouter from "./routes/webhooks";
import paymentsRouter from "./routes/payments";
import courseContentRouter from "./routes/course-content";
import chatbotRouter from "./routes/chatbot";
import { db, pool, getDbConfig } from "./db";
import { sql } from "drizzle-orm";
import { registerRoutes } from "./routes";

const app = express();
const httpServer = createServer(app);

console.log("--- SERVER INITIALIZING: VERSION 6.0 (RESTORED & STABILIZED) ---");

// Essential Middleware
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

// Use MemoryStore for Vercel stability (Postgres session store can be tricky in serverless)
app.use(
  session({
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "hamza-platform-2026-secure",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    },
  })
);

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

// Health Check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString(), config: getDbConfig() });
});

app.get("/api/health/db", async (_req: Request, res: Response) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ ok: true, status: "connected" });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e), config: getDbConfig() });
  }
});

// Root route for API debugging
app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Taeallum API is responding!" });
});

// Register routes (legacy support)
registerRoutes(httpServer, app).catch(console.error);

export default app;
