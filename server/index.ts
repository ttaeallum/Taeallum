import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import rateLimit from "express-rate-limit";
import session, { type CookieOptions } from "express-session";
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
import { db, pool } from "./db";
import { sql } from "drizzle-orm";

const app = express();
const httpServer = createServer(app);

console.log("--- SERVER STARTED: VERSION 5.0 (FINAL FIX) ---");

// Rate limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Many requests from this IP, please try again later",
});
app.use("/api/", limiter);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// Ensure session table exists
async function ensureSessionTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      ) WITH (OIDS=FALSE);
      
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_sessions_pkey') THEN
          ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");
    `);
    console.log("Session table verified/created");

  } catch (err) {
    console.error("Critical: Failed to ensure session table:", err);
  }
}
ensureSessionTable();

app.use(express.urlencoded({ extended: false }));

app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";
const useSecureCookies = process.env.SESSION_SECURE
  ? process.env.SESSION_SECURE === "true"
  : isProduction;

const sessionCookie: CookieOptions = {
  httpOnly: false, // السماح للفرونت اند بالوصول للكوكيز للتأكد
  sameSite: useSecureCookies ? "none" : "lax", // none يتطلب HTTPS
  secure: useSecureCookies, // false للـ localhost
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 يوم
  path: "/",
};

app.use(
  session({
    store: new PostgresStore({
      pool: pool,
      tableName: "user_sessions",
      createTableIfMissing: true
    }),
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "hamza-platform-2026-secure",
    resave: false,
    saveUninitialized: true,
    cookie: sessionCookie,
    rolling: true,
  })
);
console.log("Session middleware configured with cookie settings:", sessionCookie);

// Development fallback: allow session via header when cookies are blocked
app.use((req, _res, next) => {
  if (process.env.NODE_ENV === "production") return next();
  const headerSessionId = req.headers["x-session-id"];
  if (!headerSessionId || req.session?.userId) return next();
  const sessionId = Array.isArray(headerSessionId) ? headerSessionId[0] : headerSessionId;
  if (!sessionId || typeof req.sessionStore?.get !== "function") return next();

  req.sessionStore.get(sessionId, (err, storedSession: any) => {
    if (!err && storedSession?.userId) {
      req.session.userId = storedSession.userId;
      req.session.isAdmin = storedSession.isAdmin;
    }
    next();
  });
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth")) {
    console.log("Request cookies:", req.headers.cookie);
    console.log("Request session ID:", req.sessionID);
    console.log("Request session userId:", req.session?.userId);
  }
  next();
});

app.use("/api/admin", adminAuthRouter);
app.use("/api/admin-panel", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/courses", publicCoursesRouter);
app.use("/api/access", accessRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/course-content", courseContentRouter);
app.use("/api/chatbot", chatbotRouter);

app.get("/api/health/db", async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ ok: true, db: "connected" });
  } catch (e) {
    res.status(500).json({ ok: false, db: "not connected", error: String(e) });
  }
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Register routes for both dev and prod (including Vercel)
await registerRoutes(httpServer, app);

export default app;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  (async () => {
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Internal Server Error:", err);

      if (res.headersSent) {
        return next(err);
      }

      return res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`serving on port ${port}`);
      },
    );
  })();
}
