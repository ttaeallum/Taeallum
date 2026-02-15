import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { lessons } from "../db/schema";
import { eq } from "drizzle-orm";

const router = Router();
const normalizeYoutubeUrl = (url: string) => {
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(ytRegex);
    if (match && match[1]) {
        return `https://www.youtube.com/watch?v=${match[1]}`;
    }
    return url;
};

// 1. Fetch from YouTube and send to Bunny
router.post("/fetch-to-bunny", async (req: Request, res: Response) => {
    // v18: Strict selection to avoid collision with RENDER_SERVICE_ID
    const libraryId = process.env.BUNNY_LIBRARY_ID || "597149";
    const apiKey = process.env.BUNNY_API_KEY || "367a5c92-24fb-4fdb-82d0b1e4107a-959f-4b99";

    try {
        if (!libraryId || libraryId.startsWith("srv-")) {
            throw new Error(`[v18] Invalid Library ID detected: ${libraryId}. Please check Render environment variables.`);
        }
        const { lessonId } = req.body;
        if (!lessonId) return res.status(400).json({ message: "Lesson ID is required" });

        const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
        if (!lesson || !lesson.originalYoutubeUrl) {
            return res.status(404).json({ message: "Lesson or original YouTube URL not found" });
        }

        const cleanUrl = normalizeYoutubeUrl(lesson.originalYoutubeUrl);
        console.log(`[BUNNY] Starting fetch for lesson: ${lesson.title} - URL: ${cleanUrl}`);

        // Step 1: Create Video Entry in Bunny
        const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
            method: 'POST',
            headers: {
                'AccessKey': apiKey as string,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: lesson.title })
        });

        if (!createRes.ok) {
            const errBody = await createRes.text();
            console.error("[BUNNY Step 1 Error]", errBody);
            throw new Error(`[BUNNY 400] Step 1: ${errBody}`);
        }

        const videoData = await createRes.json();
        const bunnyVideoId = videoData.guid;

        // Step 2: Request Bunny to Fetch from YouTube URL
        // Bunny Stream supports uploading from URL
        const fetchRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyVideoId}/fetch`, {
            method: 'POST',
            headers: {
                'AccessKey': apiKey as string,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: cleanUrl })
        });

        if (!fetchRes.ok) {
            const errBody = await fetchRes.text();
            console.error("[BUNNY Step 2 Error]", errBody);

            // Helpful guidance for YouTube fetch failures
            if (errBody.includes("Invalid file") || errBody.includes("Forbidden")) {
                throw new Error(`[BUNNY 400] يوتيوب يمنع السحب التلقائي حالياً. يرجى استخدام متصفح Bunny للانتقال اليدوي ونسخ الـ ID.`);
            }

            throw new Error(`[BUNNY 400] Step 2: ${errBody}`);
        }

        // Step 3: Update DB with Bunny Video ID and new URL
        // Bunny Embed URL format: https://iframe.mediadelivery.net/embed/LIBRARY_ID/VIDEO_ID
        const bunnyEmbedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${bunnyVideoId}`;

        await db.update(lessons)
            .set({
                bunnyVideoId: bunnyVideoId,
                videoUrl: bunnyEmbedUrl
            })
            .where(eq(lessons.id, lessonId));

        res.json({
            success: true,
            message: "Transfer initiated! Video is being processed by Bunny.net",
            bunnyVideoId,
            videoUrl: bunnyEmbedUrl
        });

    } catch (error: any) {
        console.error("[BUNNY ERROR]", error);
        res.status(500).json({ message: error.message || "Failed to initiate Bunny transfer" });
    }
});

export default router;
