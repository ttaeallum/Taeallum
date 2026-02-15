import { db } from './server/db/index';
import { courses, sections, lessons } from './server/db/schema';
import { eq, sql } from 'drizzle-orm';

async function cleanup() {
    console.log("Cleaning up empty courses...");

    // Unpublish courses that have 0 lessons
    const emptyCourses = await db.select({ id: courses.id, title: courses.title })
        .from(courses)
        .leftJoin(sections, eq(sections.courseId, courses.id))
        .leftJoin(lessons, eq(lessons.sectionId, sections.id))
        .groupBy(courses.id)
        .having(sql`count(${lessons.id}) = 0`);

    console.log(`Found ${emptyCourses.length} empty courses. Unpublishing them...`);

    for (const course of emptyCourses) {
        await db.update(courses)
            .set({ isPublished: false })
            .where(eq(courses.id, course.id));
        console.log(`Unpublished: ${course.title}`);
    }

    console.log("Cleanup finished.");
    process.exit(0);
}

cleanup();
