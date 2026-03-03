import fs from 'fs';
import { db } from "../db/index";
import { lessons } from "../db/schema";
import { eq } from "drizzle-orm";

const MAPPINGS_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/server/scripts/bunny_mappings.json';
const EXISTING_VIDEOS_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/server/scripts/existing_bunny_videos.json';

async function updateBunnyIds() {
    console.log("=== Starting Bunny Video ID Synchronization ===");

    // 1. Load Mappings (from current session)
    let mappings: Record<string, string> = {};
    if (fs.existsSync(MAPPINGS_PATH)) {
        mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf-8'));
        console.log(`Loaded ${Object.keys(mappings).length} mappings from bunny_mappings.json`);
    }

    // 2. Load Existing Videos (from previous sessions/full fetch)
    if (fs.existsSync(EXISTING_VIDEOS_PATH)) {
        const existingVideos: any[] = JSON.parse(fs.readFileSync(EXISTING_VIDEOS_PATH, 'utf-8'));
        console.log(`Loaded ${existingVideos.length} videos from existing_bunny_videos.json`);
        for (const video of existingVideos) {
            if (video.title && video.guid) {
                // Only add if not already in mappings (mappings takes precedence as it's fresh)
                if (!mappings[video.title]) {
                    mappings[video.title] = video.guid;
                }
            }
        }
    }

    const titles = Object.keys(mappings);
    console.log(`Total unique titles to sync: ${titles.length}`);

    let updatedCount = 0;
    for (const title of titles) {
        const videoId = mappings[title];

        // Update lessons where title matches
        const result = await db.update(lessons)
            .set({ bunnyVideoId: videoId })
            .where(eq(lessons.title, title));

        // Note: Drizzle update result doesn't always return rowCount depending on driver, 
        // but we'll assume it works if no error.
        updatedCount++;

        if (updatedCount % 50 === 0) {
            console.log(`  Processed ${updatedCount} updates...`);
        }
    }

    console.log(`=== Bunny Synchronization Completed! Total titles processed: ${updatedCount} ===`);
}

updateBunnyIds().catch(console.error);
