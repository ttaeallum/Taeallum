
import "dotenv/config";
import { db, pool } from "./server/db";
import { sql } from "drizzle-orm";

async function test() {
    try {
        console.log("Testing DB connection...");
        const result = await db.execute(sql`SELECT 1 as connected`);
        console.log("DB Test Success:", result);
        process.exit(0);
    } catch (err) {
        console.error("DB Test Failed:", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

test();
