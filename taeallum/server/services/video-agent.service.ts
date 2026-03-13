import { geminiVideo } from "./gemini";
import * as fs from "fs";
import * as path from "path";

/**
 * Extracts full transcript with timestamps from a video file using Gemini's native video capabilities.
 */
export async function extractVideoContent(videoPath: string): Promise<string> {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`الفيديو غير موجود في المسار: ${videoPath}`);
  }

  // قراءة الفيديو كـ base64
  const videoBuffer = fs.readFileSync(videoPath);
  const base64Video = videoBuffer.toString("base64");
  
  // تحديد نوع الفيديو
  const ext = path.extname(videoPath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska"
  };
  const mimeType = mimeTypes[ext] || "video/mp4";

  console.log(`[VIDEO_AGENT] Processing video with Gemini (${mimeType}): ${videoPath}`);

  const result = await geminiVideo.generateContent([
    {
      inlineData: {
        data: base64Video,
        mimeType: mimeType
      }
    },
    {
      text: `استخرج النص الكامل من هذا الفيديو التعليمي بالتفصيل.
      أرجع النص مع التوقيتات الزمنية بهذا الشكل:
      [00:00] النص هنا...
      [00:30] النص هنا...
      اللغة: العربية فقط`
    }
  ]);

  const output = result.response.text();
  console.log(`[VIDEO_AGENT] Extraction successful!`);
  return output;
}
