import { db } from "./server/db/index.js";
import { courses, categories } from "./server/db/schema.js";

async function checkCoverage() {
    console.log("🔍 Checking database coverage for all specialties...");
    const allCourses = await db.select().from(courses);
    const allCategories = await db.select().from(categories);

    console.log(`\n📊 Total Courses: ${allCourses.length}`);
    console.log(`📊 Total Categories: ${allCategories.length}`);

    console.log("\n📋 Course List:");
    allCourses.forEach(c => {
        console.log(`- [${c.level}] ${c.title} (ID: ${c.id})`);
    });

    console.log("\n📋 Category List:");
    allCategories.forEach(cat => {
        console.log(`- ${cat.name} (Slug: ${cat.slug})`);
    });

    process.exit(0);
}

checkCoverage().catch(err => {
    console.error(err);
    process.exit(1);
});
