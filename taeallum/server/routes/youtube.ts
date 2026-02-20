import { Router, type Request, type Response } from "express";

const router = Router();

// Helper: Extract playlist ID from various YouTube URL formats
function extractPlaylistId(url: string): string | null {
    const patterns = [
        /[?&]list=([a-zA-Z0-9_-]+)/,
        /playlist\?list=([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    // Maybe it's just the ID itself
    if (/^[a-zA-Z0-9_-]{10,}$/.test(url.trim())) return url.trim();
    return null;
}

// Helper: Convert ISO 8601 duration (PT1H2M3S) to minutes
function parseDuration(iso: string): number {
    if (!iso) return 0;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
}

// POST /api/youtube/playlist - Fetch all videos from a YouTube playlist
router.post("/playlist", async (req: Request, res: Response) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ message: "رابط البلاي ليست مطلوب" });
        }

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                message: "YouTube API Key غير مُعد. أضف YOUTUBE_API_KEY في ملف .env"
            });
        }

        const playlistId = extractPlaylistId(url);
        if (!playlistId) {
            return res.status(400).json({
                message: "لم يتم العثور على معرّف البلاي ليست. تأكد من الرابط"
            });
        }

        console.log(`[YOUTUBE] Fetching playlist: ${playlistId}`);

        // Step 1: Fetch all playlist items (handles pagination)
        const allItems: any[] = [];
        let nextPageToken = "";

        do {
            const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?` +
                `part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}` +
                (nextPageToken ? `&pageToken=${nextPageToken}` : "");

            const playlistRes = await fetch(playlistUrl);
            const playlistData = await playlistRes.json();

            if (playlistData.error) {
                console.error("[YOUTUBE] API Error:", playlistData.error);
                return res.status(400).json({
                    message: `خطأ من يوتيوب: ${playlistData.error.message}`
                });
            }

            if (playlistData.items) {
                allItems.push(...playlistData.items);
            }

            nextPageToken = playlistData.nextPageToken || "";
        } while (nextPageToken);

        if (allItems.length === 0) {
            return res.status(404).json({ message: "البلاي ليست فارغة أو خاصة" });
        }

        // Step 2: Get video durations (batch by 50)
        const videoIds = allItems
            .map(item => item.snippet?.resourceId?.videoId)
            .filter(Boolean);

        const durationMap: Record<string, number> = {};

        for (let i = 0; i < videoIds.length; i += 50) {
            const batch = videoIds.slice(i, i + 50);
            const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
                `part=contentDetails&id=${batch.join(",")}&key=${apiKey}`;

            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();

            if (detailsData.items) {
                for (const video of detailsData.items) {
                    durationMap[video.id] = parseDuration(video.contentDetails?.duration || "");
                }
            }
        }

        // Step 3: Build lessons array
        const lessons = allItems
            .filter(item => item.snippet?.resourceId?.videoId) // Skip deleted videos
            .map((item, index) => {
                const videoId = item.snippet.resourceId.videoId;
                const channelId = item.snippet.videoOwnerChannelId;
                return {
                    title: item.snippet.title || `درس ${index + 1}`,
                    videoUrl: `https://www.youtube.com/embed/${videoId}`,
                    videoOwnerUrl: channelId
                        ? `https://www.youtube.com/channel/${channelId}`
                        : "",
                    duration: durationMap[videoId] || 0,
                    order: index + 1,
                    originalYoutubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
                };
            });

        // Get playlist title from first item
        const playlistTitle = allItems[0]?.snippet?.title
            ? `بلاي ليست: ${allItems.length} فيديو`
            : "بلاي ليست يوتيوب";

        console.log(`[YOUTUBE] ✅ Fetched ${lessons.length} videos from playlist ${playlistId}`);

        res.json({
            playlistId,
            playlistTitle,
            totalVideos: lessons.length,
            lessons
        });

    } catch (error: any) {
        console.error("[YOUTUBE] Error:", error);
        res.status(500).json({
            message: `فشل جلب البلاي ليست: ${error.message}`
        });
    }
});

export default router;
