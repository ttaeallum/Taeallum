import dotenv from 'dotenv';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import { randomUUID } from 'crypto';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const libraryId = process.env.BUNNY_LIBRARY_ID;
const apiKey = process.env.BUNNY_API_KEY;
const categoryId = '246bb111-62bf-4bfe-8f0a-474809081e5e'; // Computer Science

const collectionIds = [
    '67e96526-c672-4a12-8760-01f36c9e5bf8',
    'c6e26ed0-1220-4e4c-935d-a305b1978b7b',
    '51cd87ed-9f67-41ef-ade2-f00f3ff6d583',
    'abf2dd63-ab12-474d-a387-314b8b777e59',
    'a9df8d51-7b4b-4eb0-a366-1194613d2d3e',
    'c21b2846-da71-42fa-891c-9876cd25fed3',
    '8e6786cd-2891-469e-9ec8-3fb120b7b3f0',
    '42bcb113-32eb-40c3-a243-653de68b606e'
];

async function fetchCollectionInfo(collId: string) {
    const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections/${collId}`, {
        headers: { AccessKey: apiKey as string, Accept: "application/json" }
    });
    if (!response.ok) return { name: `كورس مستورد ${collId.slice(0, 4)}` };
    return response.json() as Promise<{ name: string }>;
}

async function fetchBunnyVideos(collId: string) {
    let all: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(
            `https://video.bunnycdn.com/library/${libraryId}/videos?page=${page}&itemsPerPage=100&collection=${collId}`,
            { headers: { AccessKey: apiKey as string, Accept: "application/json" } }
        );
        if (!response.ok) throw new Error(`Bunny API error ${response.status}`);
        const data: any = await response.json();
        const items = data.items || [];
        all.push(...items);
        if (items.length < 100) hasMore = false;
        else page++;
    }
    return all.sort((a, b) => a.title.localeCompare(b.title, 'en'));
}

async function importOne(collId: string) {
    console.log(`\n--- Working on: ${collId} ---`);
    const collInfo = await fetchCollectionInfo(collId);
    const videos = await fetchBunnyVideos(collId);

    if (videos.length === 0) {
        console.warn(`No videos found for ${collId}, skipping...`);
        return;
    }

    const courseTitle = collInfo.name || "كورس جديد";
    const courseSlug = `course-${collId.slice(0, 8)}-${Date.now()}`;
    const courseId = randomUUID();

    // 1. Course
    await pool.query(
        'INSERT INTO courses (id, category_id, title, slug, description, instructor, is_published, level) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [courseId, categoryId, courseTitle, courseSlug, "هذا كورس تم استيراده تلقائياً من Bunny.net", "Tallm AI", true, "beginner"]
    );

    // 2. Section
    const sectionId = randomUUID();
    await pool.query(
        'INSERT INTO sections (id, course_id, title, "order") VALUES ($1, $2, $3, $4)',
        [sectionId, courseId, "محتوى الدورة", 1]
    );

    // 3. Lessons
    for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        const lessonId = randomUUID();
        const videoUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${v.guid}`;
        await pool.query(
            'INSERT INTO lessons (id, section_id, title, bunny_video_id, video_url, "order", duration, is_free) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [lessonId, sectionId, v.title, v.guid, videoUrl, i + 1, v.length || 0, false]
        );
    }
    console.log(`Successfully imported: ${courseTitle} with ${videos.length} lessons.`);
}

async function main() {
    try {
        console.log('--- STARTING BULK IMPORT ---');
        for (const id of collectionIds) {
            try {
                await importOne(id);
            } catch (e) {
                console.error(`Failed to import ${id}:`, e);
            }
        }
        console.log('\n--- ALL IMPORTS FINISHED ---');
    } catch (err) {
        console.error('Bulk Import Global Error:', err);
    } finally {
        await pool.end();
    }
}

main();
