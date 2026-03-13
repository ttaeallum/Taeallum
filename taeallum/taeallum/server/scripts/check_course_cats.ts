import { db } from "../db/index";
import { courses } from "../db/schema";

async function main() {
    const allCourses = await db.select().from(courses);
    console.log(`Total Courses in DB: ${allCourses.length}`);
    allCourses.slice(0, 5).forEach(c => console.log(`- ${c.title} (CID: ${c.categoryId})`));

    // Check unique category IDs in courses
    const catIds = [...new Set(allCourses.map(c => c.categoryId))];
    console.log(`Unique Category IDs in Courses: ${catIds.join(', ')}`);
}

main().catch(console.error);
