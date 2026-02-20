
import { db } from "../server/db";
import { courses } from "../server/db/schema";

async function listCourses() {
    const allCourses = await db.select().from(courses);
    console.log("Found " + allCourses.length + " courses.");
    allCourses.forEach(c => {
        console.log(`- [${c.id}] ${c.title} (Current Level: ${c.level})`);
    });
    process.exit(0);
}

listCourses();
