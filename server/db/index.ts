import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const rawDbUrl = process.env.DATABASE || process.env.DATABASE_URL;
const cleanDbUrl = (rawDbUrl && rawDbUrl.trim().length > 10)
    ? rawDbUrl.replace(/^['"]|['"]$/g, "").trim()
    : null;

export const pool = new Pool({
    connectionString: cleanDbUrl || "postgresql://postgres:postgres@localhost:5432/postgres",
    ssl: cleanDbUrl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });

// Helper for diagnostics
export const getDbConfig = () => ({
    hasUrl: !!cleanDbUrl,
    urlPreview: cleanDbUrl ? `${cleanDbUrl.substring(0, 10)}...` : "NONE",
    envKeys: Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("URL"))
});
