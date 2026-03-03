import fs from 'fs';
import path from 'path';

const LIBRARY_ID = '608329';
const API_KEY = '5bff0354-0c26-4e57-b46ad190cbdf-4744-4858';
const BASE_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/Taeallum_Playlists';
const EXISTING_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/server/scripts/existing_bunny_videos.json';
const LOG_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/server/scripts/bunny_mappings.json';

// Load existing videos to skip them
let existingVideos: any[] = [];
if (fs.existsSync(EXISTING_PATH)) {
    existingVideos = JSON.parse(fs.readFileSync(EXISTING_PATH, 'utf-8'));
}
const existingTitles = new Set(existingVideos.map(v => v.title));

// Load or initialize mapping log
let mappings: Record<string, string> = {};
if (fs.existsSync(LOG_PATH)) {
    mappings = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
}

async function uploadVideo(filePath: string, title: string) {
    if (existingTitles.has(title) || mappings[title]) {
        console.log(`[SKIP] Already on Bunny: ${title}`);
        return;
    }

    console.log(`[START] Creating video object for: ${title}`);

    // 1. Create Video Object
    const createResponse = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`, {
        method: 'POST',
        headers: {
            'AccessKey': API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
    });

    if (!createResponse.ok) {
        const err = await createResponse.text();
        throw new Error(`Failed to create video object: ${err}`);
    }

    const { guid: videoId } = await createResponse.json();
    console.log(`[SUCCESS] Video object created. ID: ${videoId}`);

    // 2. Upload Binary Data
    console.log(`[UPLOAD] Starting binary upload for: ${title} (${videoId})`);

    // Use streaming to support large files (> 2GB)
    const fileStream = fs.createReadStream(filePath);

    const uploadResponse = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`, {
        method: 'PUT',
        headers: {
            'AccessKey': API_KEY,
            'Content-Type': 'application/octet-stream'
        },
        body: fileStream as any,
        // @ts-ignore - duplex is required in modern Node when body is a stream
        duplex: 'half'
    });

    if (!uploadResponse.ok) {
        const err = await uploadResponse.text();
        throw new Error(`Failed to upload binary data: ${err}`);
    }

    console.log(`[DONE] Successfully uploaded: ${title} (${videoId})`);

    // Save to log immediately
    mappings[title] = videoId;
    fs.writeFileSync(LOG_PATH, JSON.stringify(mappings, null, 2));

    return videoId;
}

async function processDirectory(dirPath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            await processDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.mp4')) {
            const title = entry.name.replace('.mp4', '');
            try {
                await uploadVideo(fullPath, title);
            } catch (error) {
                console.error(`[ERROR] Failed to process ${entry.name}:`, error);
            }
        }
    }
}

async function main() {
    console.log("=== Starting Bunny.net Automated Uploads (RESUME ENABLED) ===");
    try {
        await processDirectory(BASE_PATH);
        console.log("=== All uploads completed successfully! ===");
    } catch (error) {
        console.error("=== Fatal Error during batch upload ===", error);
    }
}

main();
