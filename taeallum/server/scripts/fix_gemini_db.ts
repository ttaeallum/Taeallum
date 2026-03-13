import { pool } from "../db";

async function fixSchema() {
  console.log("Checking and fixing database schema for Gemini...");
  try {
    // 1. Drop existing column if DIMENSION is wrong
    // We'll just drop and recreate it to be absolutely sure
    await pool.query(`
      ALTER TABLE transcript_chunks DROP COLUMN IF EXISTS embedding;
      ALTER TABLE transcript_chunks ADD COLUMN embedding vector(768);
    `);
    console.log("✅ Recreated embedding column with 768 dimensions for Gemini.");

    // 2. Truncate table because old OpenAI chunks are useless
    await pool.query("TRUNCATE TABLE transcript_chunks;");
    console.log("✅ Truncated transcript_chunks table.");

    console.log("Schema migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration Error:", err);
    process.exit(1);
  }
}

fixSchema();
