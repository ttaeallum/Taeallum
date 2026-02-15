import "dotenv/config";
import { db, pool } from "./server/db";
import { lessons } from "./server/db/schema";
import { eq } from "drizzle-orm";

async function checkLesson() {
    try {
        const rows = await db.select().from(lessons);
        console.log("LESSON_DATA_START");
        console.log(JSON.stringify(rows.map(r => ({
            id: r.id,
            title: r.title,
            videoUrl: r.videoUrl,
            bunnyVideoId: r.bunnyVideoId,
            originalYoutubeUrl: r.originalYoutubeUrl
        })), null, 2));
        console.log("LESSON_DATA_END");
    } catch (err) {
        console.error("Query Failed:", err);
    } finally {
        await pool.end();
    }
}

checkLesson();
