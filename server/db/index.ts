import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const rawDbUrl = process.env.DATABASE || process.env.DATABASE_URL;
const cleanDbUrl = (rawDbUrl && rawDbUrl.trim().length > 10)
    ? rawDbUrl.replace(/^['"]|['"]$/g, "").trim()
    : null;

if (cleanDbUrl) {
    console.log(`[DB] Connection string found (Starts with: ${cleanDbUrl.substring(0, 15)}...)`);
} else {
    console.error("[DB] CRITICAL: Connection string is MISSING or too short!");
}

export const pool = new Pool({
    connectionString: cleanDbUrl || "postgresql://postgres:postgres@localhost:5432/postgres",
    ssl: cleanDbUrl ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });
