import { db } from "./server/db/index";
import { courses } from "./server/db/schema";

async function verify() {
    const allCourses = await db.select().from(courses);
    console.log("Course Status:");
    allCourses.forEach(c => {
        console.log(`- ${c.title}: ${c.thumbnail || 'NO THUMBNAIL'}`);
    });
    process.exit(0);
}

verify().catch(console.error);
