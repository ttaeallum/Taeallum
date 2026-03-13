
import { db } from "../server/db";
import { courses } from "../server/db/schema";
import fetch from "node-fetch";

async function validateThumbnails() {
    console.log("--- Validating Course Thumbnails ---");
    const allCourses = await db.query.courses.findMany();

    let brokenCount = 0;
    for (const course of allCourses) {
        if (!course.thumbnail) {
            console.log(`[MISSING] ${course.title} (${course.id})`);
            brokenCount++;
            continue;
        }

        try {
            const res = await fetch(course.thumbnail, { method: 'HEAD' });
            if (!res.ok) {
                console.log(`[BROKEN] ${course.title}: ${course.thumbnail}`);
                brokenCount++;
            }
        } catch (e) {
            console.log(`[ERROR] ${course.title}: ${course.thumbnail}`);
            brokenCount++;
        }
    }

    console.log(`\nValidation complete. Found ${brokenCount} broken/missing thumbnails out of ${allCourses.length} courses.`);
    process.exit(0);
}

validateThumbnails().catch(console.error);
