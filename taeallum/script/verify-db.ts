
import "dotenv/config";
import { db } from "../server/db";
import { lessons, courses, sections } from "../server/db/schema";
import { eq, sql } from "drizzle-orm";

async function verify() {
    const courseData = await db.select().from(courses);
    console.log(`--- Database Verification ---`);
    console.log(`Total Courses: ${courseData.length}`);

    for (const course of courseData) {
        const result = await db.select({
            count: sql<number>`count(${lessons.id})`
        })
            .from(lessons)
            .innerJoin(sections, eq(lessons.sectionId, sections.id))
            .where(eq(sections.courseId, course.id));

        console.log(`Course: "${course.title}" (ID: ${course.id}) -> ${result[0].count} lessons`);
    }

    const totalLessons = await db.select({ count: sql<number>`count(*)` }).from(lessons);
    console.log(`\nGrand Total Lessons in DB: ${totalLessons[0].count}`);
}

verify().catch(console.error).finally(() => process.exit());
