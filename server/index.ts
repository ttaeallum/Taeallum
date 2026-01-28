import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import rateLimit from "express-rate-limit";
import session from "express-session";
import connectPg from "connect-pg-simple";
const PostgresStore = connectPg(session);
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

const app = express();
const httpServer = createServer(app);

console.log("--- SERVER INITIALIZING: VERSION 5.6 (DIAGNOSTICS) ---");

// Essential Middleware
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

// Session Configuration
const isProduction = process.env.NODE_ENV === "production";
const useSecureCookies = process.env.SESSION_SECURE === "true" || isProduction;

app.use(
  session({
    store: new PostgresStore({
      pool: pool,
      tableName: "user_sessions",
      createTableIfMissing: true
    }),
    name: "connect.sid",
    secret: process.env.SESSIONSECRET || process.env.SESSION_SECRET || "hamza-platform-2026-secure",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: false,
      sameSite: useSecureCookies ? "none" : "lax",
      secure: useSecureCookies,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    },
    rolling: true,
  })
);

// API Routes setup
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin-panel", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/courses", publicCoursesRouter);
app.use("/api/access", accessRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/course-content", courseContentRouter);
app.use("/api/chatbot", chatbotRouter);

// Database Health Check
app.get("/api/health/db", async (_req, res) => {
  const config = getDbConfig();
  try {
    await db.execute(sql`select 1`);
    const result = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    res.json({
      ok: true,
      status: "connected",
      tables: result.rows.map((r: any) => r.table_name),
      config: config
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: String(e),
      config: config,
      env_keys: Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("URL"))
    });
  }
});

// Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Register routes (non-blocking for Vercel)
registerRoutes(httpServer, app).catch(err => {
  console.error("Failed to register routes:", err);
});

// Export for Vercel
export default app;

// Local development server
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  (async () => {
    try {
      if (process.env.NODE_ENV === "production") {
        serveStatic(app);
      } else {
        const { setupVite } = await import("./vite");
        await setupVite(httpServer, app);
      }
      const port = parseInt(process.env.PORT || "5000", 10);
      httpServer.listen({ port, host: "0.0.0.0" }, () => {
        console.log(`Serving on port ${port}`);
      });
    } catch (err) {
      console.error("Failed to start local server:", err);
    }
  })();
}
