import "dotenv/config";
import { db, pool } from "./server/db";
import { sql } from "drizzle-orm";

async function migrate() {
    try {
        console.log("Starting manual migration...");

        // Add verification columns to users table
        console.log("Adding verification columns to users table...");
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false NOT NULL;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_code" text;`);
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_code_expires_at" timestamp;`);

        // Add bunny_video_id
        console.log("Adding bunny_video_id column to lessons table...");
        await db.execute(sql`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "bunny_video_id" text;`);

        // Add original_youtube_url
        console.log("Adding original_youtube_url column to lessons table...");
        await db.execute(sql`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "original_youtube_url" text;`);

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
