
import "dotenv/config";
import { db } from "../server/db";
import { lessons } from "../server/db/schema";
import { eq } from "drizzle-orm";

const BUNNY_LIBRARY_ID = "597149";

function isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

async function fixBunnyVideos() {
    console.log("--- Fixing Bunny Video URLs ---\n");

    const allLessons = await db.select().from(lessons);
    let fixed = 0;

    for (const lesson of allLessons) {
        if (!lesson.videoUrl || lesson.videoUrl.trim() === "") {
            continue;
        }

        const videoUrl = lesson.videoUrl.trim();

        if (isUUID(videoUrl)) {
            const embedUrl = `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoUrl}`;

            console.log(`Fixing lesson "${lesson.title}":`);
            console.log(`  Old: ${videoUrl}`);
            console.log(`  New: ${embedUrl}`);

            await db.update(lessons)
                .set({
                    videoUrl: embedUrl,
                    bunnyVideoId: videoUrl
                })
                .where(eq(lessons.id, lesson.id));

            fixed++;
            console.log(`  ✅ Done.\n`);
        }
    }

    console.log(`\n✅ Fixed ${fixed} lessons.`);
}

fixBunnyVideos().catch(console.error).finally(() => process.exit());
