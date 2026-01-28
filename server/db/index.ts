import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const rawDbUrl = process.env.DATABASE || process.env.DATABASE_URL;
const cleanDbUrl = (rawDbUrl && rawDbUrl.trim() !== "") ? rawDbUrl.replace(/^['"]|['"]$/g, "") : null;

if (!cleanDbUrl && process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    console.warn("WARNING: DATABASE_URL is missing in production environment!");
}

export const pool = new Pool({
    connectionString: cleanDbUrl || "postgres://localhost:5432/postgres", // Fallback to avoid immediate crash
    ssl: cleanDbUrl ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });
