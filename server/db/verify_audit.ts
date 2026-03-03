import { db } from "./index";
import { lessons, courses, sections } from "./schema";
import { sql, eq } from "drizzle-orm";

async function verify() {
    console.log("=== Final Platform Audit ===");

    const totalLessonsRes = await db.select({ count: sql<number>`count(*)` }).from(lessons);
    const linkedLessonsRes = await db.select({ count: sql<number>`count(*)` }).from(lessons).where(sql`bunny_video_id IS NOT NULL`);

    console.log(`Total Lessons in Database: ${totalLessonsRes[0].count}`);
    console.log(`Lessons linked to Bunny.net: ${linkedLessonsRes[0].count}`);

    const courseList = await db.select().from(courses);
    console.log("\nCourse Breakdown:");
    for (const course of courseList) {
        const lessonCountRes = await db.select({ count: sql<number>`count(lessons.id)` })
            .from(lessons)
            .innerJoin(sections, eq(lessons.sectionId, sections.id))
            .where(eq(sections.courseId, course.id));

        const linkedCountRes = await db.select({ count: sql<number>`count(lessons.id)` })
            .from(lessons)
            .innerJoin(sections, eq(lessons.sectionId, sections.id))
            .where(sql`${sections.courseId} = ${course.id} AND bunny_video_id IS NOT NULL`);

        console.log(`- ${course.title}: ${lessonCountRes[0].count} lessons (${linkedCountRes[0].count} linked)`);
    }

    console.log("\n=== Audit Completed ===");
}

verify().catch(console.error);
