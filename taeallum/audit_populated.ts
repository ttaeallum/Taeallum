import { db } from './server/db/index';
import { courses, sections, lessons } from './server/db/schema';
import { eq, sql } from 'drizzle-orm';

async function audit() {
    console.log("Auditing populated courses...");

    const populated = await db.select({
        id: courses.id,
        title: courses.title,
        lessonCount: sql<number>`count(${lessons.id})`
    })
        .from(courses)
        .leftJoin(sections, eq(sections.courseId, courses.id))
        .leftJoin(lessons, eq(lessons.sectionId, sections.id))
        .groupBy(courses.id, courses.title)
        .having(sql`count(${lessons.id}) > 0`);

    console.log(`\nTOTAL POPULATED COURSES: ${populated.length}`);
    console.log("------------------------------------------");
    populated.forEach((c, i) => {
        console.log(`${i + 1}. ${c.title} (${c.lessonCount} lessons)`);
    });

    process.exit(0);
}

audit();
