import fs from 'fs';
import path from 'path';

const BASE_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/Taeallum_Playlists';
const MAPPINGS_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/server/scripts/bunny_mappings.json';
const EXISTING_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/server/scripts/existing_bunny_videos.json';

function findMissing() {
    const uploaded = new Set<string>();

    if (fs.existsSync(MAPPINGS_PATH)) {
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf-8'));
        Object.keys(mappings).forEach(t => uploaded.add(t));
    }

    if (fs.existsSync(EXISTING_PATH)) {
        const existing = JSON.parse(fs.readFileSync(EXISTING_PATH, 'utf-8'));
        existing.forEach((v: any) => {
            if (v.title) uploaded.add(v.title);
        });
    }

    const missing: string[] = [];

    function walk(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.mp4')) {
                const title = entry.name.replace('.mp4', '');
                if (!uploaded.has(title)) {
                    missing.push(fullPath);
                }
            }
        }
    }

    walk(BASE_PATH);
    console.log(`--- MISSING_COUNT: ${missing.length} ---`);
    console.log(JSON.stringify(missing.slice(0, 10), null, 2));
}

findMissing();
