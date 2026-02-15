import { db } from './server/db';
import { courses, lessons, sections } from './server/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
    try {
        const allCourses = await db.select().from(courses);
        const data = [];

        for (const course of allCourses) {
            // Get sections for this course
            const courseSections = await db.select().from(sections).where(eq(sections.courseId, course.id));
            const sectionIds = courseSections.map(s => s.id);

            let sampleLesson = null;
            if (sectionIds.length > 0) {
                // Get the first lesson to see the source/playlist info
                const firstLessons = await db.select().from(lessons)
                    .where(eq(lessons.sectionId, sectionIds[0]))
                    .limit(1);
                if (firstLessons.length > 0) {
                    sampleLesson = {
                        title: firstLessons[0].title,
                        videoUrl: firstLessons[0].videoUrl,
                        originalYoutubeUrl: firstLessons[0].originalYoutubeUrl,
                        videoOwnerUrl: firstLessons[0].videoOwnerUrl
                    };
                }
            }

            data.push({
                id: course.id,
                title: course.title,
                instructor: course.instructor,
                thumbnail: course.thumbnail,
                sampleLesson
            });
        }

        console.log('---START_COURSE_DATA---');
        console.log(JSON.stringify(data));
        console.log('---END_COURSE_DATA---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
