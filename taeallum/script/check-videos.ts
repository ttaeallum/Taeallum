
import "dotenv/config";
import { db } from "../server/db";
import { lessons } from "../server/db/schema";

async function checkVideos() {
    const allLessons = await db.select().from(lessons);

    const nonYoutube = allLessons.filter(l => l.videoUrl && !l.videoUrl.includes('youtube.com') && !l.videoUrl.includes('youtu.be'));

    console.log("Non-YouTube Lessons:", JSON.stringify(nonYoutube, null, 2));
}

checkVideos().catch(console.error).finally(() => process.exit());
