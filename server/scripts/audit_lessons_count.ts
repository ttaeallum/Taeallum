import { db } from "../db/index";
import { courses, lessons, sections } from "../db/schema";
import { isNotNull, count, eq, inArray } from "drizzle-orm";

async function main() {
    // 1. Get the IDs of the linked 27 courses
    const linkedCourses = await db.select({ id: courses.id })
        .from(courses)
        .innerJoin(sections, eq(sections.courseId, courses.id))
        .innerJoin(lessons, eq(lessons.sectionId, sections.id))
        .where(isNotNull(lessons.bunnyVideoId))
        .groupBy(courses.id);

    const courseIds = linkedCourses.map(c => c.id);

    if (courseIds.length === 0) {
        console.log("--- LESSON_COUNT: 0 ---");
        return;
    }

    // 2. Count total lessons for these courses
    const lessonResult = await db.select({ val: count() })
        .from(lessons)
        .innerJoin(sections, eq(sections.id, lessons.sectionId))
        .where(inArray(sections.courseId, courseIds));

    console.log(`--- TOTAL_LESSONS_FOR_ROADMAP: ${lessonResult[0].val} ---`);
}

main().catch(console.error);
