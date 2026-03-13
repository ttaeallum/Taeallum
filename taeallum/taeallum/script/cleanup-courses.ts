
import { db } from "../server/db";
import { courses, lessons, sections } from "../server/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";

async function cleanupCourses() {
    console.log("--- Starting Course Catalog Cleanup ---");

    // 1. Fetch all courses with sections and lessons
    const allCourses = await db.query.courses.findMany({
        with: {
            sections: {
                with: {
                    lessons: true
                }
            }
        }
    });

    console.log(`Total courses found: ${allCourses.length}`);

    const coursesToDelete: string[] = [];
    const duplicates = new Map<string, any[]>();

    // Pass 1: Categorize
    for (const course of allCourses) {
        let lessonCount = 0;
        course.sections.forEach(s => lessonCount += s.lessons.length);

        if (lessonCount === 0) {
            console.log(`[EMPTY] Marking for deletion: "${course.title}" (${course.id})`);
            coursesToDelete.push(course.id);
            continue;
        }

        const titleKey = course.title.trim().toLowerCase();
        if (!duplicates.has(titleKey)) {
            duplicates.set(titleKey, []);
        }
        duplicates.get(titleKey)!.push({
            id: course.id,
            title: course.title,
            lessons: lessonCount,
            createdAt: course.createdAt
        });
    }

    // Pass 2: Deduplicate
    for (const [title, occurences] of duplicates.entries()) {
        if (occurences.length > 1) {
            // Sort by: 1. Lesson Count (desc), 2. CreatedAt (asc)
            occurences.sort((a, b) => {
                if (b.lessons !== a.lessons) return b.lessons - a.lessons;
                return a.createdAt.getTime() - b.createdAt.getTime();
            });

            const winner = occurences[0];
            const losers = occurences.slice(1);

            console.log(`[DUPLICATE] Keeping: "${winner.title}" (${winner.id}) with ${winner.lessons} lessons.`);
            for (const loser of losers) {
                console.log(`[DUPLICATE] Marking for deletion: "${loser.title}" (${loser.id}) with ${loser.lessons} lessons.`);
                coursesToDelete.push(loser.id);
            }
        }
    }

    // Pass 3: Execution
    if (coursesToDelete.length > 0) {
        console.log(`\nExecuting deletion for ${coursesToDelete.length} courses...`);

        // Using chunks to avoid large query errors if many
        const chunkSize = 50;
        for (let i = 0; i < coursesToDelete.length; i += chunkSize) {
            const chunk = coursesToDelete.slice(i, i + chunkSize);
            await db.delete(courses).where(inArray(courses.id, chunk));
        }
        console.log("Deletion complete.");
    } else {
        console.log("\nNo courses to delete.");
    }

    console.log("\n--- Cleanup Finished ---");
    process.exit(0);
}

cleanupCourses().catch(console.error);
