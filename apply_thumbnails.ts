import fs from 'fs';
import path from 'path';
import { db } from "./server/db/index";
import { courses } from "./server/db/schema";
import { eq } from "drizzle-orm";

const ARTIFACT_DIR = 'C:/Users/user/.gemini/antigravity/brain/d16388e1-8dac-4f78-948e-8034472bc2e9';
const PUBLIC_DIR = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/client/public/thumbnails';

const mappings = [
    { pattern: 'intro_to_programming_thumbnail', slug: '01_Intro_to_Programming' },
    { pattern: 'structured_programming_thumbnail', slug: '02_Structured_Programming' },
    { pattern: 'oop_thumbnail', slug: '03_OOP' },
    { pattern: 'data_structures_thumbnail', slug: '04_Data_Structures' },
    { pattern: 'linear_algebra_thumbnail', slug: '06_Linear_Algebra' },
    { pattern: 'probability_statistics_thumbnail', slug: '07_Probability_and_Statistics' },
    { pattern: 'databases_sql_thumbnail', slug: '11_Databases' },
    { pattern: 'machine_learning_thumbnail', slug: '01_Machine_Learning' },
    { pattern: 'deep_learning_thumbnail', slug: '02_Deep_Learning' },
    { pattern: 'nlp_thumbnail', slug: '03_NLP' },
    { pattern: 'computer_vision_thumbnail', slug: '04_Computer_Vision' },
    { pattern: 'object_detection_thumbnail', slug: '05_Object_Detection' },
    { pattern: 'infosec_thumbnail', slug: '01_InfoSec' },
    { pattern: 'ethical_hacking_thumbnail', slug: '03_Ethical_Hacking' },
    { pattern: 'network_security_thumbnail', slug: '04_Network_Security' },
    { pattern: 'frontend_thumbnail', slug: '01_Frontend' },
    { pattern: 'react_ts_thumbnail', slug: '02_React_TS' },
];

async function applyThumbnails() {
    console.log("=== Applying Generated Thumbnails ===");

    if (!fs.existsSync(PUBLIC_DIR)) {
        fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    const files = fs.readdirSync(ARTIFACT_DIR);

    for (const mapping of mappings) {
        const foundFile = files.find(f => f.startsWith(mapping.pattern) && f.endsWith('.png'));
        if (foundFile) {
            const srcPath = path.join(ARTIFACT_DIR, foundFile);
            const destName = `${mapping.slug}.png`;
            const destPath = path.join(PUBLIC_DIR, destName);

            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied: ${foundFile} -> ${destName}`);

            // Update DB
            const dbPath = `/thumbnails/${destName}`;
            await db.update(courses)
                .set({ thumbnail: dbPath })
                .where(eq(courses.slug, mapping.slug));
            console.log(`Updated DB for: ${mapping.slug} with ${dbPath}`);
        } else {
            console.warn(`[WARN] No thumbnail found for pattern: ${mapping.pattern}`);
        }
    }

    console.log("=== Thumbnail Application Complete ===");
    process.exit(0);
}

applyThumbnails().catch(console.error);
