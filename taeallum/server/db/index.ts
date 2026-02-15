import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Universal DB Finder
const findDbUrl = () => {
    // 1. Direct match
    let url = process.env.DATABASE_URL || process.env.DATABASE || process.env.DB_URL || process.env.DB;

    // 2. Fuzzy match (any key containing DATABASE and starting with postgres)
    if (!url) {
        const fuzzyKey = Object.keys(process.env).find(k =>
            k.toUpperCase().includes("DATABASE") &&
            process.env[k]?.trim().startsWith("postgres")
        );
        if (fuzzyKey) url = process.env[fuzzyKey];
    }

    // 3. Clean and Validate
    if (url && url.trim().length > 10) {
        return url.replace(/^['"]|['"]$/g, "").trim();
    }
    return null;
};

const cleanDbUrl = findDbUrl();

export const pool = new Pool({
    connectionString: cleanDbUrl || undefined,
    ssl: { rejectUnauthorized: false }, // Always SSL for Neon
    connectionTimeoutMillis: 15000,
    max: 10
});

export const db = drizzle(pool, { schema });

export const getDbConfig = () => ({
    hasUrl: !!cleanDbUrl,
    preview: cleanDbUrl ? `${cleanDbUrl.substring(0, 15)}...` : "MISSING",
    envKeys: Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("URL"))
});
