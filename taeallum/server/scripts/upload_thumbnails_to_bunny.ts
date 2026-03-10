/**
 * Script: upload_thumbnails_to_bunny.ts
 * Uploads all thumbnail images to Bunny CDN Storage and updates the DB with external URLs
 */
import * as dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { db } from "../../server/db/index.js";
import { courses } from "../../server/db/schema.js";
import { eq, isNotNull } from "drizzle-orm";

const BUNNY_API_KEY = process.env.BUNNY_API_KEY || "";
const BUNNY_STORAGE_ZONE = "taeallum-media"; // CDN storage zone name
const BUNNY_STORAGE_API = "https://storage.bunnycdn.com";
const CDN_HOST = "https://taeallum-media.b-cdn.net";
const THUMBNAILS_DIR = path.resolve(process.cwd(), "client", "public", "thumbnails");

async function uploadFile(filePath: string, fileName: string): Promise<string> {
    const fileContent = fs.readFileSync(filePath);
    const url = `${BUNNY_STORAGE_API}/${BUNNY_STORAGE_ZONE}/thumbnails/${fileName}`;

    console.log(`[UPLOAD] Uploading ${fileName}...`);

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "AccessKey": BUNNY_API_KEY,
            "Content-Type": "image/png",
        },
        body: fileContent,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to upload ${fileName}: ${response.status} ${text}`);
    }

    const cdnUrl = `${CDN_HOST}/thumbnails/${fileName}`;
    console.log(`[OK] Uploaded: ${cdnUrl}`);
    return cdnUrl;
}

async function main() {
    if (!fs.existsSync(THUMBNAILS_DIR)) {
        console.error("Thumbnails directory not found:", THUMBNAILS_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(THUMBNAILS_DIR).filter(f => f.endsWith(".png"));
    console.log(`[INFO] Found ${files.length} thumbnail files to upload`);

    // Map: folder prefix → course slug pattern
    const uploadedUrls: Record<string, string> = {};

    for (const file of files) {
        const filePath = path.join(THUMBNAILS_DIR, file);
        const cdnUrl = await uploadFile(filePath, file);
        uploadedUrls[file] = cdnUrl;
    }

    console.log("\n[DB] Updating course thumbnails in database...");

    // Fetch all courses
    const allCourses = await db.select({ id: courses.id, slug: courses.slug, thumbnail: courses.thumbnail }).from(courses).where(isNotNull(courses.slug));

    let updated = 0;
    for (const course of allCourses) {
        // Find a matching thumbnail by checking if any uploaded file key matches the course slug
        const slug = course.slug || "";

        // Match: thumbnail field already has a local path like /thumbnails/01_Intro_to_Programming.png
        if (course.thumbnail && course.thumbnail.startsWith("/thumbnails/")) {
            const localFile = path.basename(course.thumbnail);
            const newUrl = uploadedUrls[localFile];

            if (newUrl) {
                await db.update(courses).set({ thumbnail: newUrl }).where(eq(courses.id, course.id));
                console.log(`[DB] Updated ${slug}: ${newUrl}`);
                updated++;
            } else {
                console.log(`[SKIP] No uploaded file found for course: ${slug} (thumbnail: ${course.thumbnail})`);
            }
        }
    }

    console.log(`\n[DONE] Updated ${updated} courses with CDN thumbnail URLs`);
    process.exit(0);
}

main().catch(err => {
    console.error("[ERROR]", err);
    process.exit(1);
});
