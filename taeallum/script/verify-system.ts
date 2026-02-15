import "dotenv/config";
import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";
import * as schema from "../server/db/schema";

async function verifySystem() {
    console.log("🚀 Starting Full System Verification...");
    console.log("--------------------------------------");

    try {
        // 1. Check DB Connection
        console.log("📡 Testing Database Connection...");
        const result = await db.execute(sql`SELECT NOW()`);
        console.log("✅ Database connected successfully at:", result.rows[0].now);

        // 2. Verify Schema & Data
        console.log("\n📊 Fetching System Stats...");

        const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
        console.log(`- Total Users: ${userCount.count}`);

        const [courseCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.courses);
        console.log(`- Total Courses: ${courseCount.count}`);

        const [catCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.categories);
        console.log(`- Total Categories: ${catCount.count}`);

        const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.orders);
        console.log(`- Total Orders: ${orderCount.count}`);

        const [enrollmentCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.enrollments);
        console.log(`- Total Enrollments: ${enrollmentCount.count}`);

        const [adCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.ads);
        console.log(`- Total Ads Configured: ${adCount.count}`);

        console.log("\n✅ Database integrity check passed.");

        console.log("\n--------------------------------------");
        console.log("🎉 System is healthy and properly connected to the database.");

    } catch (error) {
        console.error("\n❌ System Verification Failed!");
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

verifySystem();
