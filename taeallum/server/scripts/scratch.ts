import "dotenv/config";
import fetch from "node-fetch";

async function main() {
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;

    if (!libraryId || !apiKey) {
        console.error("Missing library ID or API key");
        return;
    }

    const collectionId = "457f58ea-4189-4906-9bb8-42410d348063";
    
    // 1. Fetch collection details
    console.log(`Fetching collection ${collectionId}...`);
    const collRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections/${collectionId}`, {
        headers: { "AccessKey": apiKey, "Accept": "application/json" }
    });
    
    if (collRes.ok) {
        const collData = await collRes.json();
        console.log("Collection Details:", JSON.stringify(collData, null, 2));
    } else {
        console.error("Failed to fetch collection:", collRes.status, await collRes.text());
    }

    // 2. Fetch videos in this collection
    console.log(`Fetching videos for collection ${collectionId}...`);
    const vidRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos?collection=${collectionId}&itemsPerPage=100`, {
        headers: { "AccessKey": apiKey, "Accept": "application/json" }
    });

    if (vidRes.ok) {
        const vidData = await vidRes.json();
        const items = (vidData as any).items || [];
        console.log(`Found ${items.length} videos.`);
        for (const v of items.slice(0, 5)) {
            console.log(`- ${v.title} (${v.guid})`);
        }
    } else {
        console.error("Failed to fetch videos:", vidRes.status, await vidRes.text());
    }
}

main().catch(console.error);
