import "dotenv/config";
import { Pool } from "pg";

const findDbUrl = () => {
    let url = process.env.DATABASE_URL || process.env.DATABASE || process.env.DB_URL || process.env.DB;
    if (!url) {
        const fuzzyKey = Object.keys(process.env).find(k =>
            k.toUpperCase().includes("DATABASE") &&
            process.env[k]?.trim().startsWith("postgres")
        );
        if (fuzzyKey) url = process.env[fuzzyKey];
    }
    if (url && url.trim().length > 10) {
        return url.replace(/^['"]|['"]$/g, "").trim();
    }
    return null;
};

async function main() {
    const dbUrl = findDbUrl();
    if (!dbUrl) {
        console.error("❌ DATABASE_URL not found!");
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
    });

    try {
        console.log("🔌 Connecting to database...");

        // Count before deletion
        const courseCount = await pool.query("SELECT COUNT(*) FROM courses");
        const sectionCount = await pool.query("SELECT COUNT(*) FROM sections");
        const lessonCount = await pool.query("SELECT COUNT(*) FROM lessons");
        const enrollmentCount = await pool.query("SELECT COUNT(*) FROM enrollments");

        console.log("\n📊 Current data:");
        console.log(`   Courses: ${courseCount.rows[0].count}`);
        console.log(`   Sections: ${sectionCount.rows[0].count}`);
        console.log(`   Lessons: ${lessonCount.rows[0].count}`);
        console.log(`   Enrollments: ${enrollmentCount.rows[0].count}`);

        // Delete in order (respect foreign keys)
        console.log("\n🗑️  Deleting all course data...");

        const r1 = await pool.query("DELETE FROM lessons");
        console.log(`   ✅ Deleted ${r1.rowCount} lessons`);

        const r2 = await pool.query("DELETE FROM sections");
        console.log(`   ✅ Deleted ${r2.rowCount} sections`);

        const r3 = await pool.query("DELETE FROM enrollments");
        console.log(`   ✅ Deleted ${r3.rowCount} enrollments`);

        // Set orders.courseId to NULL (don't delete orders - they are payment records)
        const r4 = await pool.query("UPDATE orders SET course_id = NULL WHERE course_id IS NOT NULL");
        console.log(`   ✅ Unlinked ${r4.rowCount} orders from courses`);

        const r5 = await pool.query("DELETE FROM courses");
        console.log(`   ✅ Deleted ${r5.rowCount} courses`);

        console.log("\n🎉 Done! All courses have been deleted successfully.");
        console.log("   You can now add new courses from the admin panel.");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await pool.end();
    }
}

main();
