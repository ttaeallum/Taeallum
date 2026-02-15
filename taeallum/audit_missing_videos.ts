import { db } from './server/db/index';
import { courses, sections, lessons } from './server/db/schema';
import { eq, sql } from 'drizzle-orm';

async function audit() {
    try {
        const allCourses = await db.select({
            id: courses.id,
            title: courses.title,
            lessonsCount: sql<number>`(SELECT COUNT(*) FROM ${lessons} l JOIN ${sections} s ON l.section_id = s.id WHERE s.course_id = ${courses}.id)`
        }).from(courses);

        const emptyCourses = allCourses.filter(c => Number(c.lessonsCount) === 0);

        console.log('--- Empty Courses (0 lessons) ---');
        emptyCourses.forEach(c => console.log(`- ${c.title} (ID: ${c.id})`));
        console.log('Total Empty:', emptyCourses.length);

        const coursesWithMissingVideos = await db.select({
            courseTitle: courses.title,
            lessonTitle: lessons.title
        })
            .from(lessons)
            .innerJoin(sections, eq(lessons.sectionId, sections.id))
            .innerJoin(courses, eq(sections.courseId, courses.id))
            .where(sql`${lessons.videoUrl} IS NULL OR ${lessons.videoUrl} = ''`);

        console.log('\n--- Lessons with missing Video URLs ---');
        coursesWithMissingVideos.forEach(l => console.log(`- ${l.courseTitle}: ${l.lessonTitle}`));
        console.log('Total Missing URLs:', coursesWithMissingVideos.length);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
audit();
