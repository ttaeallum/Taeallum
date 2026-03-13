import "dotenv/config";
import fs from "fs";
import { db } from "../db";
import { courses, sections, lessons } from "../db/schema";
import { eq, and, asc } from "drizzle-orm";

interface BunnyVideoItem {
  guid: string;
  title: string;
  collectionId?: string | null;
  length?: number;
}

/**
 * CLI script to link all videos from a Bunny collectionId to lessons in a specific section.
 *
 * Usage:
 *   npx tsx server/scripts/link_bunny_collection_to_lessons.ts <collectionId> <courseSlug> <sectionTitle>
 *
 * Behavior:
 *   - Loads videos from existing_bunny_videos.json (fetched earlier by fetch_bunny_videos.ts).
 *   - Filters videos by collectionId and sorts them by title.
 *   - Finds the course by slug, then the section by title within that course.
 *   - Orders lessons in that section by their "order" field.
 *   - For each pair (lesson, video) by index:
 *       - Sets lessons.bunnyVideoId = video.guid
 *       - Sets lessons.videoUrl = Bunny iframe embed URL using BUNNY_LIBRARY_ID and video.guid
 *   - If there are more videos than lessons, the extras are logged and ignored.
 *   - If there are more lessons than videos, extra lessons are left unchanged.
 */
async function linkCollectionToLessons() {
  const [, , collectionId, courseSlug, sectionTitle] = process.argv;

  if (!collectionId || !courseSlug || !sectionTitle) {
    console.error(
      "Usage: npx tsx server/scripts/link_bunny_collection_to_lessons.ts <collectionId> <courseSlug> <sectionTitle>"
    );
    process.exit(1);
  }

  const libraryId = process.env.BUNNY_LIBRARY_ID;
  if (!libraryId) {
    console.error("Missing BUNNY_LIBRARY_ID in environment.");
    process.exit(1);
  }

  const existingPath =
    "c:/Users/user/Downloads/Learn-Platform-Updated-2zip/taeallum/server/scripts/existing_bunny_videos.json";
  if (!fs.existsSync(existingPath)) {
    console.error(
      `existing_bunny_videos.json not found at ${existingPath}. Run fetch_bunny_videos.ts first.`
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(existingPath, "utf-8");
  const allVideos = JSON.parse(raw) as BunnyVideoItem[];

  const videos = allVideos
    .filter((v) => v.collectionId === collectionId)
    .sort((a, b) => a.title.localeCompare(b.title, "en"));

  if (videos.length === 0) {
    console.error(`No videos found for collectionId=${collectionId}`);
    process.exit(1);
  }

  console.log(`Found ${videos.length} videos in collection ${collectionId}`);

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, courseSlug))
    .limit(1);

  if (!course) {
    console.error(`Course not found with slug=${courseSlug}`);
    process.exit(1);
  }

  const [section] = await db
    .select()
    .from(sections)
    .where(and(eq(sections.courseId, course.id), eq(sections.title, sectionTitle)))
    .limit(1);

  if (!section) {
    console.error(
      `Section not found with title="${sectionTitle}" in course slug=${courseSlug}`
    );
    process.exit(1);
  }

  const sectionLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.sectionId, section.id))
    .orderBy(asc(lessons.order));

  if (sectionLessons.length === 0) {
    console.error("No lessons found in the target section.");
    process.exit(1);
  }

  console.log(
    `Linking ${videos.length} videos to ${sectionLessons.length} lessons in section "${section.title}"`
  );

  const pairs = Math.min(videos.length, sectionLessons.length);

  for (let i = 0; i < pairs; i++) {
    const video = videos[i];
    const lesson = sectionLessons[i];
    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${video.guid}`;

    await db
      .update(lessons)
      .set({
        bunnyVideoId: video.guid,
        videoUrl: embedUrl,
      })
      .where(eq(lessons.id, lesson.id));

    console.log(
      `Linked lesson "${lesson.title}" (order=${lesson.order}) -> video "${video.title}" (${video.guid})`
    );
  }

  if (videos.length > sectionLessons.length) {
    console.warn(
      `Warning: ${videos.length - sectionLessons.length} videos had no matching lessons (more videos than lessons).`
    );
  }
  if (sectionLessons.length > videos.length) {
    console.warn(
      `Warning: ${sectionLessons.length - videos.length} lessons had no matching videos (more lessons than videos).`
    );
  }

  console.log("Done linking collection to lessons.");
}

linkCollectionToLessons().catch((err) => {
  console.error("link_bunny_collection_to_lessons failed:", err);
  process.exit(1);
});

