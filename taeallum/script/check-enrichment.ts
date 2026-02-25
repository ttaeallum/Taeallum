
import "dotenv/config";
import { db } from "../server/db";
import { lessons, courses } from "../server/db/schema";

async function check() {
    console.log("--- Enrichment Status ---");

    const allCourses = await db.select().from(courses);
    console.log(`\nCourses: ${allCourses.length}`);
    for (const c of allCourses) {
        const hasDesc = !!c.description && c.description.trim().length > 10;
        const hasAiDesc = !!c.aiDescription && c.aiDescription.trim().length > 10;
        const dur = c.duration || 0;
        console.log(`- ${c.title}: Desc=${hasDesc}, AI_Desc=${hasAiDesc}, Duration=${dur}`);
    }

    const allLessons = await db.select().from(lessons);
    let lessonsWithContent = 0;
    let lessonsWithDuration = 0;
    for (const l of allLessons) {
        if (l.content && l.content.trim().length > 5) lessonsWithContent++;
        if (l.duration && l.duration > 0) lessonsWithDuration++;
    }

    console.log(`\nLessons: ${allLessons.length}`);
    console.log(`- With Content: ${lessonsWithContent}`);
    console.log(`- With Duration: ${lessonsWithDuration}`);
}

check().catch(console.error).finally(() => process.exit());
