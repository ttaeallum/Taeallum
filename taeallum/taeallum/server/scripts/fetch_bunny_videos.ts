import "dotenv/config";
import fs from "fs";

async function fetchAllVideos() {
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;

    if (!libraryId || !apiKey) {
        throw new Error("Missing BUNNY_LIBRARY_ID or BUNNY_API_KEY in environment");
    }

    let allVideos: unknown[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        console.log(`Fetching page ${page}...`);
        const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos?page=${page}&itemsPerPage=100`, {
            headers: { "AccessKey": apiKey, "Accept": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch videos: ${await response.text()}`);
        }

        const data = (await response.json()) as { items?: unknown[] };
        const items = Array.isArray(data.items) ? data.items : [];
        allVideos = allVideos.concat(items);

        if (items.length < 100) {
            hasMore = false;
        } else {
            page++;
        }
    }

    fs.writeFileSync('c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/server/scripts/existing_bunny_videos.json', JSON.stringify(allVideos, null, 2));
    console.log(`Successfully fetched ${allVideos.length} videos.`);
}

fetchAllVideos().catch(console.error);
