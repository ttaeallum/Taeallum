import fs from 'fs';

const MAPPINGS_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/server/scripts/bunny_mappings.json';
const EXISTING_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/server/scripts/existing_bunny_videos.json';

function audit() {
    const titles = new Set<string>();

    if (fs.existsSync(MAPPINGS_PATH)) {
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf-8'));
        Object.keys(mappings).forEach(t => titles.add(t));
    }

    if (fs.existsSync(EXISTING_PATH)) {
        const existing = JSON.parse(fs.readFileSync(EXISTING_PATH, 'utf-8'));
        existing.forEach((v: any) => {
            if (v.title) titles.add(v.title);
        });
    }

    console.log(`--- UPLOADED_UNIQUE_COUNT: ${titles.size} ---`);
}

audit();
