import { db } from "../db/index";
import { courses, lessons, sections } from "../db/schema";
import { isNotNull, count, eq } from "drizzle-orm";

async function main() {
    // 1. Total courses in DB
    const totalResult = await db.select({ val: count() }).from(courses);
    const totalCount = totalResult[0].val;

    // 2. Count courses that have at least one lesson with a bunnyVideoId
    // Join courses -> sections -> lessons
    const linkedResult = await db.select({ courseId: courses.id })
        .from(courses)
        .innerJoin(sections, eq(sections.courseId, courses.id))
        .innerJoin(lessons, eq(lessons.sectionId, sections.id))
        .where(isNotNull(lessons.bunnyVideoId))
        .groupBy(courses.id);

    const linkedCount = linkedResult.length;

    console.log(`--- AUDIT_TOTAL: ${totalCount} ---`);
    console.log(`--- AUDIT_LINKED: ${linkedCount} ---`);

    // 3. Roadmap specific check (The 27 we just added)
    // We know they start with IDs like '01_Core_IT_Courses' etc.
    // But let's just stick to the total DB count for the user.
}

main().catch(console.error);
