import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const rawDbUrl = process.env.DATABASE || process.env.DATABASE_URL;
// Clean the URL from possible surrounding quotes
const cleanDbUrl = rawDbUrl?.replace(/^['"]|['"]$/g, "");

export const pool = new Pool({
    connectionString: cleanDbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

export const db = drizzle(pool, { schema });
