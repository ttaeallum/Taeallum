
import { db } from "../server/db";
import { courses, lessons, sections } from "../server/db/schema";
import { eq, sql, count } from "drizzle-orm";

async function auditCourses() {
    console.log("--- Course Catalog Audit ---");

    // 1. Fetch all courses with their lesson counts
    const allCourses = await db.query.courses.findMany({
        with: {
            sections: {
                with: {
                    lessons: true
                }
            }
        }
    });

    console.log(`Total Courses: ${allCourses.length}`);

    const coursesWithNoLessons = [];
    const duplicates = new Map();
    const missingThumbnails = [];

    for (const course of allCourses) {
        // Count lessons
        let lessonCount = 0;
        course.sections.forEach(s => {
            lessonCount += s.lessons.length;
        });

        if (lessonCount === 0) {
            coursesWithNoLessons.push({ id: course.id, title: course.title });
        }

        // Check for duplicates (by title)
        const titleKey = course.title.trim().toLowerCase();
        if (!duplicates.has(titleKey)) {
            duplicates.set(titleKey, []);
        }
        duplicates.get(titleKey).push({ id: course.id, lessons: lessonCount });

        // Check for missing thumbnails
        if (!course.thumbnail || course.thumbnail.trim() === "" || course.thumbnail.toLowerCase().includes("placeholder")) {
            missingThumbnails.push({ id: course.id, title: course.title, thumbnail: course.thumbnail });
        } else {
            console.log(`Sample Thumbnail: ${course.thumbnail}`);
        }
    }

    console.log(`\nCourses with 0 lessons: ${coursesWithNoLessons.length}`);
    coursesWithNoLessons.forEach(c => console.log(`- [${c.id}] ${c.title}`));

    console.log(`\nDuplicate Titles Found:`);
    let duplicateCount = 0;
    for (const [title, occurences] of duplicates.entries()) {
        if (occurences.length > 1) {
            duplicateCount += (occurences.length - 1);
            console.log(`- "${title}" (${occurences.length} times)`);
            occurences.forEach(o => console.log(`  * ID: ${o.id}, Lessons: ${o.lessons}`));
        }
    }

    console.log(`\nCourses missing thumbnails: ${missingThumbnails.length}`);
    // missingThumbnails.forEach(c => console.log(`- [${c.id}] ${c.title}`));

    process.exit(0);
}

auditCourses().catch(console.error);
