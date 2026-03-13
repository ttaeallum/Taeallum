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
    if (/^[a-zA-Z0-9_-]{10,}$/.test(url.trim())) return url.trim();
    return null;
}

// POST /api/youtube/playlist - Fetch all videos from a YouTube playlist (NO API KEY NEEDED)
router.post("/playlist", async (req: Request, res: Response) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ message: "رابط البلاي ليست مطلوب" });
        }

        const playlistId = extractPlaylistId(url);
        if (!playlistId) {
            return res.status(400).json({
                message: "لم يتم العثور على معرّف البلاي ليست. تأكد من الرابط"
            });
        }

        console.log(`[YOUTUBE] Fetching playlist: ${playlistId}`);

        // Fetch the playlist page HTML from YouTube
        const pageUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
        const response = await fetch(pageUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            }
        });

        if (!response.ok) {
            return res.status(400).json({ message: "فشل الوصول لصفحة البلاي ليست" });
        }

        const html = await response.text();

        // Extract the ytInitialData JSON from the page
        const dataMatch = html.match(/var\s+ytInitialData\s*=\s*({.+?});\s*<\/script>/s);
        if (!dataMatch) {
            return res.status(400).json({
                message: "البلاي ليست خاصة أو غير موجودة"
            });
        }

        let ytData: any;
        try {
            ytData = JSON.parse(dataMatch[1]);
        } catch {
            return res.status(400).json({ message: "فشل قراءة بيانات البلاي ليست" });
        }

        // Navigate the YouTube data structure to find playlist videos
        const contents = ytData
            ?.contents
            ?.twoColumnBrowseResultsRenderer
            ?.tabs?.[0]
            ?.tabRenderer
            ?.content
            ?.sectionListRenderer
            ?.contents?.[0]
            ?.itemSectionRenderer
            ?.contents?.[0]
            ?.playlistVideoListRenderer
            ?.contents;

        if (!contents || contents.length === 0) {
            return res.status(404).json({ message: "البلاي ليست فارغة أو خاصة" });
        }

        // Extract video data
        const lessons = contents
            .filter((item: any) => item.playlistVideoRenderer)
            .map((item: any, index: number) => {
                const video = item.playlistVideoRenderer;
                const videoId = video.videoId;
                const title = video.title?.runs?.[0]?.text || `درس ${index + 1}`;

                // Duration: "12:34" format
                const durationText = video.lengthText?.simpleText || "0:00";
                const durationParts = durationText.split(":").map(Number);
                let minutes = 0;
                if (durationParts.length === 3) {
                    minutes = durationParts[0] * 60 + durationParts[1];
                } else if (durationParts.length === 2) {
                    minutes = durationParts[0];
                }

                // Channel info
                const channelName = video.shortBylineText?.runs?.[0]?.text || "";
                const channelUrl = video.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl || "";

                return {
                    title,
                    videoUrl: `https://www.youtube.com/embed/${videoId}`,
                    videoOwnerUrl: channelUrl ? `https://www.youtube.com${channelUrl}` : "",
                    duration: minutes,
                    order: index + 1,
                    channelName,
                };
            });

        if (lessons.length === 0) {
            return res.status(404).json({ message: "لم يتم العثور على فيديوهات" });
        }

        // Get playlist title
        const playlistTitle = ytData
            ?.metadata
            ?.playlistMetadataRenderer
            ?.title || `بلاي ليست (${lessons.length} فيديو)`;

        console.log(`[YOUTUBE] ✅ Fetched ${lessons.length} videos from playlist "${playlistTitle}"`);

        res.json({
            playlistId,
            playlistTitle,
            totalVideos: lessons.length,
            lessons,
            channelName: lessons[0]?.channelName || ""
        });

    } catch (error: any) {
        console.error("[YOUTUBE] Error:", error);
        res.status(500).json({
            message: `فشل جلب البلاي ليست: ${error.message}`
        });
    }
});

export default router;
