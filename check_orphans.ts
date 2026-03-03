
import { db } from "./server/db/index.js";
import { lessons, sections, courses } from "./server/db/schema.js";
import { sql, eq, isNull } from "drizzle-orm";

async function check() {
    try {
        const allLessons = await db.select({ count: sql`count(*)::int` }).from(lessons);
        const orphanedLessons = await db.select({ count: sql`count(*)::int` })
            .from(lessons)
            .leftJoin(sections, eq(lessons.sectionId, sections.id))
            .where(isNull(sections.id));

        const allSections = await db.select({ count: sql`count(*)::int` }).from(sections);
        const orphanedSections = await db.select({ count: sql`count(*)::int` })
            .from(sections)
            .leftJoin(courses, eq(sections.courseId, courses.id))
            .where(isNull(courses.id));

        console.log('Total Lessons:', allLessons[0].count);
        console.log('Orphaned Lessons (no section):', orphanedLessons[0].count);
        console.log('Total Sections:', allSections[0].count);
        console.log('Orphaned Sections (no course):', orphanedSections[0].count);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
