/** Platform Version: 1.1.2-stable (Schema Sync) **/
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import path from "path";
import fs from "fs";

import adminAuthRouter from "./routes/admin-auth";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import publicCoursesRouter from "./routes/public-courses";
import accessRouter from "./routes/access";
import webhooksRouter from "./routes/webhooks";
import paymentsRouter from "./routes/payments";
import courseContentRouter from "./routes/course-content";
import bunnyRouter from "./routes/bunny";
import chatbotRouter from "./routes/chatbot";
import aiEngineRouter from "./routes/ai-engine";
import adsRouter from "./routes/ads";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { serveStatic } from "./static";
import { registerRoutes } from "./routes";

const app = express();
const httpServer = createServer(app);


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1); // Render standard for trust proxy

// --- Domain & HTTPS Redirect Middleware ---
app.use((req: Request, res: Response, next: NextFunction) => {
  const host = req.get("host");

  // 1. Force HTTPS in production
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }

  // 2. Domain redirect (Old domain)
  if (host === "teaellum.space" || host === "www.teaellum.space") {
    return res.redirect(301, `https://taallm.com${req.originalUrl}`);
  }

  // 3. WWW to root redirect for consistency
  if (host === "www.taallm.com") {
    return res.redirect(301, `https://taallm.com${req.originalUrl}`);
  }
  next();
});

// --- Session Configuration ---
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PgSession = connectPg(session);
const sessionStore = new PgSession({
  pool,
  createTableIfMissing: true,
  errorLog: (err: any) => console.error("[SESSION STORE ERROR]", err)
});

console.log("[SESSION] استخدام مخزن جلسات PostgreSQL");

// Ensure database schema is up to date in production
(async () => {
  try {
    // 1. Session table primary key fix
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session') THEN
          IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid = 'session'::regclass AND contype = 'p') THEN
            ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");
          END IF;
        END IF;
      END $$;
    `);

    // 2. Courses table: Add ai_description column if missing
    await pool.query(`
      ALTER TABLE "courses" 
      ADD COLUMN IF NOT EXISTS "ai_description" TEXT;
    `);

    // 3. Lessons table: Add bunny_video_id, original_youtube_url, and video_owner_url if missing
    await pool.query(`
      ADD COLUMN IF NOT EXISTS "bunny_video_id" TEXT,
      ADD COLUMN IF NOT EXISTS "original_youtube_url" TEXT,
      ADD COLUMN IF NOT EXISTS "video_owner_url" TEXT;
    `);

    // 4. Create Ads table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "ads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "location" text NOT NULL UNIQUE,
        "is_active" boolean DEFAULT true NOT NULL,
        "type" text NOT NULL,
        "headline" text,
        "description" text,
        "primary_text" text,
        "primary_link" text,
        "media_url" text,
        "script_code" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log("[DB] Schema synchronization completed successfully.");
  } catch (err) {
    console.error("[DB ERROR] Failed during schema synchronization:", err);
  }
})();

app.use(
  session({
    store: sessionStore,
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "hamza-platform-2026-secure",
    resave: true, // Ensure session is updated in the store
    saveUninitialized: false,
    rolling: true, // Keep session alive on activity
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    },
    proxy: true
  })
);

// --- 1. PRIORITY DEBUG ROUTES ---
app.get("/api/health-check-v2", async (req, res) => {
  try {
    // 1. Check DB Connection & Info
    const dbInfo = await pool.query("SELECT current_database(), current_user, inet_server_addr(), inet_server_port()");

    // 2. Check Session Table
    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'session'
    `);

    // 3. Check Session Count
    const sessionCount = await pool.query("SELECT COUNT(*) FROM session");

    // 4. Check User and Course Count
    const userCount = await pool.query("SELECT COUNT(*) FROM users");
    const courseCount = await pool.query("SELECT COUNT(*) FROM courses");

    res.json({
      status: "ok",
      database: "connected",
      dbDetails: {
        name: dbInfo.rows[0].current_database,
        // Host info from pool options (masked)
        host: (pool.options.connectionString as string)?.split("@")[1]?.split("/")[0] || "unknown",
      },
      counts: {
        sessions: sessionCount.rows[0].count,
        users: userCount.rows[0].count,
        courses: courseCount.rows[0].count,
      },
      env: process.env.NODE_ENV,
      version: "1.1.2-stable"
    });
  } catch (err: any) {
    console.error("[HEALTH CHECK ERROR]", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.use("/api", (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    console.log(`[API SESSION DEBUG] ${req.method} ${req.url} - SID: ${req.sessionID} - HasUser: ${!!req.session.userId}`);
  }
  next();
});

// --- 1. PRIORITY DEBUG ROUTES ---
// (Ping moved to top)

app.get("/api/debug/index", async (_req, res) => {
  try {
    const indexPath = path.resolve(process.cwd(), "dist", "public", "index.html");
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, "utf-8");
      res.set("Content-Type", "text/plain");
      res.send(content);
    } else {
      res.json({ error: "index.html not found", path: indexPath });
    }
  } catch (e: any) {
    res.json({ error: String(e) });
  }
});

// --- 2. API MODULES ---
app.use("/api/auth", authRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin-panel", adminRouter);
app.use("/api/courses", publicCoursesRouter);
app.use("/api/access", accessRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/course-content", courseContentRouter);
app.use("/api/bunny", bunnyRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/ai-engine", aiEngineRouter);
import { default as seoRouter } from "./routes/seo";

app.use("/api/ads", adsRouter);
app.use("/", seoRouter);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// --- 3. SERVER STARTUP ---
(async () => {
  const PORT = Number(process.env.PORT) || 5000;

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running on port ${PORT}`);
  });

  try {
    // Ensure ads table exists in database
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        location TEXT NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        type TEXT NOT NULL DEFAULT 'image',
        headline TEXT,
        description TEXT,
        primary_text TEXT,
        primary_link TEXT,
        media_url TEXT,
        script_code TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log("[DB] Ads table ensured.");

    await registerRoutes(httpServer, app);

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }
  } catch (error) {
    console.error("[CRITICAL STARTUP ERROR]", error);
  }

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error(`[RUNTIME ERROR] ${req.method} ${req.url}:`, err);
    res.status(err.status || 500).json({ message: "Server Error" });
  });
})();

export default app;
