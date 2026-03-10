import fs from 'fs';
import path from 'path';
import { db } from "../db/index";
import { categories, courses, sections, lessons } from "../db/schema";
import { eq, and } from "drizzle-orm";

const BASE_PATH = 'c:/Users/user/Downloads/Learn-Platform-Updated-2zip/Taeallum_Playlists';

async function syncLessons() {
    console.log("=== Starting Lesson Synchronization from Local Files ===");

    const sectors = fs.readdirSync(BASE_PATH, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name.match(/^\d+/));

    for (const sector of sectors) {
        const sectorPath = path.join(BASE_PATH, sector.name);
        console.log(`Processing Sector: ${sector.name}`);

        const courseDirs = fs.readdirSync(sectorPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory());

        for (const courseDir of courseDirs) {
            const coursePath = path.join(sectorPath, courseDir.name);
            console.log(`  Processing Course: ${courseDir.name}`);

            // Find course in DB
            const [course] = await db.select().from(courses).where(eq(courses.slug, courseDir.name)).limit(1);
            if (!course) {
                console.warn(`[WARN] Course slug '${courseDir.name}' not found in database. Skipping.`);
                continue;
            }

            // Find or create section
            let [section] = await db.select().from(sections)
                .where(and(eq(sections.courseId, course.id), eq(sections.title, "Course Material")))
                .limit(1);

            if (!section) {
                [section] = await db.insert(sections).values({
                    courseId: course.id,
                    title: "Course Material",
                    order: 1,
                }).returning();
            }

            // Get local MP4 files
            const files = fs.readdirSync(coursePath)
                .filter(f => f.endsWith('.mp4'))
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

            if (files.length === 0) {
                console.log(`    No MP4 files found in ${courseDir.name}.`);
                continue;
            }

            // Clear existing lessons for this section to avoid duplicates
            await db.delete(lessons).where(eq(lessons.sectionId, section.id));
            console.log(`    Cleared existing lessons for section: ${section.title}`);

            // Insert new lessons
            for (let i = 0; i < files.length; i++) {
                const fileName = files[i];
                const title = fileName.replace('.mp4', '');

                await db.insert(lessons).values({
                    sectionId: section.id,
                    title: title,
                    order: i + 1,
                    isFree: true,
                });
            }
            console.log(`    Inserted ${files.length} lessons for course: ${course.title}`);
        }
    }

    console.log("=== Lesson Synchronization Completed Successfully! ===");
}

syncLessons().catch(console.error);
