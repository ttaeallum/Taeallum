/** Platform Version: 1.1.4-stable (Resilient Sync) **/
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import path from "path";
import fs from "fs";
import cors from "cors";
import compression from "compression";
import cluster from "cluster";
import os from "os";

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
import payTabsRouter from "./routes/paytabs";
import youtubeRouter from "./routes/youtube";
import promoCodesRouter from "./routes/promo-codes";
import seoRouter from "./routes/seo";
import aiAnalysisRouter from "./routes/ai-analysis";
import aiRouter from "./routes/ai";

import { db } from "./db";
import { sql } from "drizzle-orm";
import { serveStatic } from "./static";
import { registerRoutes } from "./routes";

import connectPg from "connect-pg-simple";
import { pool } from "./db";

const app = express();
const httpServer = createServer(app);

// 1. Core Midlleware & Security
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Response compression (gzip/deflate) — reduces bandwidth ~70% for JSON/HTML
app.use(compression());

app.use(express.json({
  verify: (req: any, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhooks')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: false }));


app.set("trust proxy", 1);

// Request Logger
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// --- Domain & HTTPS Redirect Middleware ---
app.use((req: Request, res: Response, next: NextFunction) => {
  const host = req.get("host");

  // 1. Force HTTPS in production
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }

  // 2. Domain redirect (Old domain)
  if (host === "teaellum.space" || host === "www.teaellum.space") {
    return res.redirect(301, `https://tallm.com${req.originalUrl}`);
  }

  // 3. WWW to root redirect for consistency
  if (host === "www.tallm.com") {
    return res.redirect(301, `https://tallm.com${req.originalUrl}`);
  }
  next();
});

// --- Session Configuration ---
const PgSession = connectPg(session);
const sessionStore = new PgSession({
  pool,
  createTableIfMissing: true,
  errorLog: (err: any) => console.error("[SESSION STORE ERROR]", err)
});

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
app.use("/api/paytabs", payTabsRouter);
app.use("/api/youtube", youtubeRouter);
app.use("/api/ads", adsRouter);
app.use("/api/promo-codes", promoCodesRouter);
app.use("/api/ai-analysis", aiAnalysisRouter);
app.use("/api/ai", aiRouter);
app.use("/", seoRouter);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/thumbnails", express.static(path.join(process.cwd(), "client", "public", "thumbnails")));
app.use(express.static(path.join(process.cwd(), "client", "public")));

// --- 3. CLUSTER & STARTUP ---
if (cluster.isPrimary && process.env.NODE_ENV === "production") {
  const numCPUs = os.cpus().length;
  console.log(`[CLUSTER] Primary ${process.pid} — spawning ${numCPUs} workers`);
  for (let i = 0; i < numCPUs; i++) cluster.fork();
  cluster.on("exit", (worker, code, signal) => {
    console.warn(`[CLUSTER] Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });
} else {
  (async () => {
    console.log("[SESSION] استخدام مخزن جلسات PostgreSQL");

    // Initialize Vite Early in Development
    let viteInstance: any = null;
    if (process.env.NODE_ENV !== "production") {
      const { setupVite } = await import("./vite");
      viteInstance = await setupVite(httpServer, app);
    }

    const PORT = Number(process.env.PORT) || 5000;

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`[SERVER] Worker ${process.pid} running on port ${PORT}`);
    });

    try {
      // Ensure database schema is up to date in production
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
      ALTER TABLE "lessons"
      ADD COLUMN IF NOT EXISTS "bunny_video_id" TEXT,
      ADD COLUMN IF NOT EXISTS "original_youtube_url" TEXT,
      ADD COLUMN IF NOT EXISTS "video_owner_url" TEXT;
    `);

      // 4. Users table: Add preferences column for AI memory
      await pool.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "preferences" JSONB;
    `);
      // 5. Create Subscriptions table if missing (Needed for AI Sessions)
      await pool.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "plan" text NOT NULL,
        "status" text NOT NULL DEFAULT 'active',
        "stripe_customer_id" text,
        "stripe_subscription_id" text,
        "current_period_start" timestamp NOT NULL,
        "current_period_end" timestamp NOT NULL,
        "cancel_at_period_end" boolean NOT NULL DEFAULT false,
        "currency" text NOT NULL DEFAULT 'usd',
        "amount" decimal(10,2) NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

      // 6. AI Sessions Table & Columns
      await pool.query(`
      CREATE TABLE IF NOT EXISTS "ai_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status" text NOT NULL DEFAULT 'active',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
      ALTER TABLE "ai_sessions" ADD COLUMN IF NOT EXISTS "current_state" text DEFAULT 'onboarding_goal';
      ALTER TABLE "ai_sessions" ADD COLUMN IF NOT EXISTS "user_profile" jsonb;
      ALTER TABLE "ai_sessions" ADD COLUMN IF NOT EXISTS "generated_plan" jsonb;
      ALTER TABLE "ai_sessions" ADD COLUMN IF NOT EXISTS "subscription_id" uuid REFERENCES "subscriptions"("id");
      ALTER TABLE "ai_sessions" ADD COLUMN IF NOT EXISTS "session_type" text DEFAULT 'onboarding';
      ALTER TABLE "ai_sessions" ADD COLUMN IF NOT EXISTS "messages_count" integer DEFAULT 0;
    `);

      // 7. AI Messages Table
      await pool.query(`
      CREATE TABLE IF NOT EXISTS "ai_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" uuid NOT NULL REFERENCES "ai_sessions"("id") ON DELETE CASCADE,
        "role" text NOT NULL,
        "content" text NOT NULL,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now()
      );
    `);

      // 8. Study Plans Table
      await pool.query(`
      CREATE TABLE IF NOT EXISTS "study_plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "session_id" uuid REFERENCES "ai_sessions"("id"),
        "title" text NOT NULL,
        "description" text,
        "duration" text NOT NULL,
        "total_hours" integer NOT NULL,
        "plan_data" jsonb NOT NULL,
        "status" text NOT NULL DEFAULT 'active',
        "progress" integer NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

      // 9. Adaptive Learning Tables
      await pool.query(`
      CREATE TABLE IF NOT EXISTS "students" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "age_level" text,
        "interests" jsonb DEFAULT '[]'::jsonb,
        "completed_lessons" jsonb DEFAULT '[]'::jsonb,
        "quiz_performance" text,
        "notes" text,
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS "quizzes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "lesson_id" uuid NOT NULL REFERENCES "lessons"("id") ON DELETE CASCADE,
        "questions" jsonb NOT NULL,
        "difficulty" text NOT NULL DEFAULT 'intermediate',
        "created_at" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS "quiz_submissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "quiz_id" uuid NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
        "score" integer NOT NULL,
        "answers" jsonb NOT NULL,
        "feedback" text,
        "created_at" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS "student_performance" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "strengths" jsonb DEFAULT '[]'::jsonb,
        "weaknesses" jsonb DEFAULT '[]'::jsonb,
        "last_ai_analysis_at" timestamp,
        "adaptive_notes" text,
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

      // 10. Update Lessons Table Columns
      await pool.query(`
      ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "level" text DEFAULT 'beginner';
      ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "content_type" text DEFAULT 'video';
      ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "content_link" text;
      ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "associated_quiz" text;
    `);

      console.log("[DB] All education and adaptive learning tables synchronized.");

      // Ensure ads table exists in database
      await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ads(
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

      // --- 4. STATIC FILES (must come before 404 handler) ---
      if (process.env.NODE_ENV === "production") {
        serveStatic(app);
      } else if (viteInstance) {
        const { serveViteSPA } = await import("./vite");
        serveViteSPA(viteInstance, app);
      }

      // --- 5. ERROR HANDLING (after static, only catches unmatched /api routes) ---
      app.use((req, res, next) => {
        if (req.path.startsWith("/api")) {
          return res.status(404).json({
            error: "Not Found",
            message: `Cannot ${req.method} ${req.path}`
          });
        }
        next();
      });

      // Global Error Handler
      app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
        console.error("[GLOBAL ERROR]:", err);
        const status = err.status || err.statusCode || 500;
        res.status(status).json({
          message: "حدث خطأ داخلي في الخادم",
          detail: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
          code: err.code || "ERR_INTERNAL_SERVER"
        });
      });
    } catch (error) {
      console.error("[CRITICAL STARTUP ERROR]", error);
    }
  })();
}

export default app;
