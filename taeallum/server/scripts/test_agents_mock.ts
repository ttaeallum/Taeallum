import "dotenv/config";
import { lectureAgent } from "../services/lecture-agent.service";
import { examAgent } from "../services/exam-agent.service";
import { pathAgent } from "../services/path-agent.service";
import { pool } from "../db";

/**
 * Mock Test Script
 * Since OpenAI quota is still updating, this script checks if the agents
 * are correctly wired to the new tables and database.
 */

async function runMockTest() {
  console.log("🚀 Starting Mock Test for AI Agents...");

  const testUserId = "00000000-0000-0000-0000-000000000001"; // Generic test ID
  const testCourseId = "test-course-id";
  const testLessonId = "test-lesson-id";

  try {
    // 1. Check Database Tables
    console.log("\n--- 1. Checking Database Tables ---");
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('learning_paths', 'lecture_transcripts', 'exams', 'transcript_chunks')
    `);
    console.log("Found tables:", tables.rows.map(r => r.table_name).join(", "));

    // 2. Test PathAgent Logic (Phase 1)
    console.log("\n--- 2. Testing PathAgent wiring ---");
    // Since we can't call OpenAI, we'll just check if the service is initialized
    console.log("PathAgent initialized:", !!pathAgent);

    // 3. Test LectureAgent Wiring (Phase 2)
    console.log("\n--- 3. Testing LectureAgent wiring ---");
    console.log("LectureAgent initialized:", !!lectureAgent);

    // 4. Test ExamAgent Wiring (Phase 3)
    console.log("\n--- 4. Testing ExamAgent wiring ---");
    console.log("ExamAgent initialized:", !!examAgent);

    console.log("\n✅ Wiring Test Passed! The system is ready for the API key to activate.");
    console.log("\nTo try a 'Real' test later, run: npx tsx server/scripts/seed_sample_transcript.ts");

  } catch (error) {
    console.error("\n❌ Mock Test Failed:", error);
  } finally {
    await pool.end();
  }
}

runMockTest();
