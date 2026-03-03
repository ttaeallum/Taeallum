import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const YT_DLP_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/tmp/yt-dlp.exe';
const BASE_OUT_DIR = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/Taeallum_Playlists/Pending_Uploads';

const playlists: Record<string, string> = {
    // Sector 01: Core IT
    '01_Data_Structures_Algorithms': 'https://www.youtube.com/playlist?list=PLL2zWZTDFZzjxarUL23ydiOgibhRipGYC',
    
    // Sector 02: AI
    '02_AI_Computer_Vision': 'https://www.youtube.com/playlist?list=PLBPdtL8DZBZLZ5ILzfl8NcQUTdDOGd-h6',
    '02_AI_Object_Detection': 'https://www.youtube.com/playlist?list=PLyhJeMedQd9TLcgIMzZFxHTGPpRiSD2Wi',
    
    // Sector 03: Cybersecurity
    '03_Cyber_Network_Security': 'https://www.youtube.com/playlist?list=PLMcTiCQvf-s9O-VcMqpfN86wZ6KQKR9-X',
    
    // Sector 04: Software Development
    '04_Dev_React_TS_2024': 'https://www.youtube.com/playlist?list=PLxRKoQzM5m3LhmXA4b9FwuuUFzRnJCzoe',
    '04_Dev_FullStack_MERN': 'https://www.youtube.com/playlist?list=PLSDhifuM5C42-AxO2-Ukt8oRvSNI7lg1s',
    '04_Dev_Flutter_Mobile': 'https://www.youtube.com/playlist?list=PLXsBti0EwQ6wnI8jky6vXxaM30l4bwWql',
    
    // Sector 05: Data Science
    '05_Data_Analysis_Diploma': 'https://www.youtube.com/playlist?list=PLXlHqMRg9lAanWdXQJfgcmdzH_ivNOHz6'
};

async function downloadPlaylist(name: string, url: string) {
    const outDir = path.join(BASE_OUT_DIR, name);

    // Check if directory exists and has files, skip if so
    if (fs.existsSync(outDir) && fs.readdirSync(outDir).length > 5) {
        console.log(`[SKIP] Playlist ${name} already downloaded (or has files).`);
        return true;
    }

    console.log(`[START] Downloading playlist: ${name}`);

    return new Promise((resolve, reject) => {
        const process = spawn(YT_DLP_PATH, [
            '-f', 'bestvideo+bestaudio/best',
            '--merge-output-format', 'mp4',
            '-o', `${outDir}/%(title)s.%(ext)s`,
            '--yes-playlist',
            url
        ]);

        process.stdout.on('data', (data) => console.log(`[${name}] ${data}`));
        process.stderr.on('data', (data) => console.error(`[${name}] ERR: ${data}`));

        process.on('close', (code) => {
            if (code === 0) {
                console.log(`[DONE] Finished playlist: ${name}`);
                resolve(true);
            } else {
                console.error(`[FAILED] Playlist ${name} exited with code ${code}`);
                resolve(false);
            }
        });
    });
}

async function main() {
    console.log("=== Starting Batch Playlist Downloads ===");
    for (const [name, url] of Object.entries(playlists)) {
        await downloadPlaylist(name, url);
    }
    console.log("=== All Batch Downloads Completed ===");
}

main().catch(console.error);
