import express from "express";
import { createServer } from "http";
import session from "express-session";
import authRouter from "./routes/auth";
import adminAuthRouter from "./routes/admin-auth";
import adminRouter from "./routes/admin";
import publicCoursesRouter from "./routes/public-courses";
import accessRouter from "./routes/access";
import webhooksRouter from "./routes/webhooks";
import paymentsRouter from "./routes/payments";
import courseContentRouter from "./routes/course-content";
import chatbotRouter from "./routes/chatbot";
import { getDbConfig, pool } from "./db";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./db/schema";

const app = express();
const httpServer = createServer(app);

console.log("--- SERVER INITIALIZING: VERSION 5.9 (FINAL PUSH) ---");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

app.use(session({
  secret: process.env.SESSION_SECRET || "secure-key-2026",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === "production" }
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

app.get("/api/health/db", async (_req, res) => {
  const config = getDbConfig();
  try {
    const db = drizzle(pool, { schema });
    await db.execute(sql`select 1`);
    res.json({ ok: true, status: "connected", config });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e), config });
  }
});

app.get("/api/hello", (req, res) => {
  res.json({ status: "ok", message: "API is working!" });
});

export default app;
