const LIBRARY_ID = '608329';
const API_KEY = '5bff0354-0c26-4e57-b46ad190cbdf-4744-4858';
import fs from 'fs';

async function fetchAllVideos() {
    let allVideos: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        console.log(`Fetching page ${page}...`);
        const response = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos?page=${page}&itemsPerPage=100`, {
            headers: { 'AccessKey': API_KEY, 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch videos: ${await response.text()}`);
        }

        const data: any = await response.json();
        allVideos = allVideos.concat(data.items);

        if (data.items.length < 100) {
            hasMore = false;
        } else {
            page++;
        }
    }

    fs.writeFileSync('c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/server/scripts/existing_bunny_videos.json', JSON.stringify(allVideos, null, 2));
    console.log(`Successfully fetched ${allVideos.length} videos.`);
}

fetchAllVideos().catch(console.error);
