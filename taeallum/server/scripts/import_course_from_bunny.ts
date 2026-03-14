import "dotenv/config";
import fetch from "node-fetch";
import { db } from "../db/index";
import { courses, sections, lessons } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;
    const collectionId = "457f58ea-4189-4906-9bb8-42410d348063";

    if (!libraryId || !apiKey) {
        throw new Error("Missing credentials");
    }

    console.log("Fetching collection details...");
    // 1. fetch collection
    const collRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections/${collectionId}`, {
        headers: { "AccessKey": apiKey as string, "Accept": "application/json" }
    });
    const collData: any = await collRes.json();
    const courseTitle = collData.name || "Probability";
    const courseSlug = courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "probability";

    console.log("Fetching videos...");
    let allVideos: any[] = [];
    let page = 1;
    let hasMore = true;
    while(hasMore) {
        const vidRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos?collection=${collectionId}&page=${page}&itemsPerPage=100`, {
            headers: { "AccessKey": apiKey as string, "Accept": "application/json" }
        });
        const vidData: any = await vidRes.json();
        const items = vidData.items || [];
        allVideos = allVideos.concat(items);
        if (items.length < 100) hasMore = false;
        else page++;
    }

    console.log(`Fetched ${allVideos.length} videos.`);

    // Sort videos by title
    allVideos.sort((a, b) => a.title.localeCompare(b.title));

    // 1. Create or get Course
    let [course] = await db.select().from(courses).where(eq(courses.slug, courseSlug)).limit(1);
    if (!course) {
        console.log(`Creating course ${courseTitle}...`);
        const result = await db.insert(courses).values({
            title: "احتمالات وإحصاء - Probability and Statistics",
            slug: courseSlug,
            description: `الدورة الشاملة في الاحتمالات والإحصاء.`,
            instructor: "Taeallum",
            isPublished: true,
            level: "beginner"
        }).returning();
        course = result[0];
    } else {
        console.log(`Course ${courseSlug} already exists.`);
    }

    // 2. Create or get Section
    let [section] = await db.select().from(sections).where(eq(sections.courseId, course.id)).limit(1);
    if (!section) {
        console.log("Creating section...");
        const result = await db.insert(sections).values({
            courseId: course.id,
            title: "المقدمة والدروس",
            order: 1
        }).returning();
        section = result[0];
    }

    // 3. Insert lessons
    for (let i = 0; i < allVideos.length; i++) {
        const video = allVideos[i];
        
        // check if lesson already exists for this bunnyVideoId
        const [existing] = await db.select().from(lessons).where(eq(lessons.bunnyVideoId, video.guid)).limit(1);
        if (existing) {
            console.log(`Lesson for video ${video.title} already exists.`);
            continue;
        }

        const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${video.guid}`;
        
        console.log(`Inserting lesson ${video.title}...`);
        await db.insert(lessons).values({
            sectionId: section.id,
            title: video.title.replace(/\.mp4$/i, ""),
            bunnyVideoId: video.guid,
            videoUrl: embedUrl,
            contentType: "video",
            order: i + 1,
            isFree: i === 0, // make first video free
            level: "beginner"
        });
    }

    console.log("Done successfully!");
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
