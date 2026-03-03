import { db } from "./server/db/index.js";
import { studyPlans, enrollments, aiSessions, aiMessages } from "./server/db/schema.js";
import { sql } from "drizzle-orm";

async function clearData() {
    console.log("🧨 Starting data cleanup...");

    try {
        // 1. Delete all Study Plans
        const deletedPlans = await db.delete(studyPlans).returning();
        console.log(`✅ Deleted ${deletedPlans.length} study plans.`);

        // 2. Delete all Enrollments (caution: this clears all student progress)
        const deletedEnrollments = await db.delete(enrollments).returning();
        console.log(`✅ Deleted ${deletedEnrollments.length} enrollments.`);

        // 3. Optional: Clear AI Chats to prevent context carry-over
        const deletedMessages = await db.delete(aiMessages).returning();
        const deletedSessions = await db.delete(aiSessions).returning();
        console.log(`✅ Deleted ${deletedMessages.length} messages and ${deletedSessions.length} sessions.`);

        console.log("✨ Cleanup completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Cleanup failed:", error);
        process.exit(1);
    }
}

clearData();
