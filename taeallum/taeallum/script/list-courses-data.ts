
import { db } from "../server/db";
import { courses } from "../server/db/schema";

async function main() {
    console.log("Fetching courses...");
    const allCourses = await db.select().from(courses);
    console.log(JSON.stringify(allCourses, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
