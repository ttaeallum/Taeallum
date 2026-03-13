import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import OpenAI from "openai";
import { getConfig } from "../config";
import { pool } from "../db";

const execAsync = promisify(exec);

export class TranscriptionService {
  private openai: OpenAI | null;

  constructor() {
    const key = getConfig("OPENAI_API_KEY");
    this.openai = key ? new OpenAI({ apiKey: key }) : null;
  }

  /**
   * Main pipeline: Video -> Audio -> Text -> Chunks -> DB
   */
  async processLesson(courseId: string, lessonId: string, videoUrlOrPath: string) {
    console.log(`[TRANSCRIPTION] Starting process for lesson ${lessonId}...`);
    
    // 1. Download/Get video file
    const tempDir = path.join(process.cwd(), "tmp", "transcription");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const videoPath = videoUrlOrPath.startsWith("http") 
      ? await this.downloadVideo(videoUrlOrPath, tempDir)
      : videoUrlOrPath;

    // 2. Extract audio using FFmpeg
    const audioPath = path.join(tempDir, `${lessonId}.mp3`);
    console.log(`[TRANSCRIPTION] Extracting audio to ${audioPath}...`);
    await execAsync(`ffmpeg -i "${videoPath}" -q:a 0 -map a "${audioPath}" -y`);

    // 3. Transcribe using Whisper
    console.log(`[TRANSCRIPTION] Transcribing with Whisper...`);
    const transcription = await this.transcribe(audioPath);

    // 4. Store Full Transcript and Segments
    console.log(`[TRANSCRIPTION] Storing full transcript...`);
    await pool.query(
      `INSERT INTO lecture_transcripts (id, lesson_id, transcript, segments, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [crypto.randomUUID(), lessonId, transcription.text, JSON.stringify(transcription.segments)]
    );

    // 5. Chunk and Generate Embeddings
    console.log(`[TRANSCRIPTION] Chunking and embedding...`);
    await this.chunkAndStore(courseId, lessonId, transcription);

    console.log(`[TRANSCRIPTION] Success for ${lessonId}!`);
    
    // Cleanup
    if (videoUrlOrPath.startsWith("http")) {
        try { fs.unlinkSync(videoPath); } catch {}
    }
    try { fs.unlinkSync(audioPath); } catch {}
  }

  private async downloadVideo(url: string, destDir: string): Promise<string> {
    const dest = path.join(destDir, "download.mp4");
    console.warn("Download not fully implemented for external URLs yet.");
    return dest;
  }

  private async transcribe(filePath: string): Promise<any> {
    if (!this.openai) throw new Error("OpenAI not configured");
    
    return await this.openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "ar",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    });
  }

  private async chunkAndStore(courseId: string, lessonId: string, transcription: any) {
    if (!this.openai) throw new Error("OpenAI not configured");

    const segments = transcription.segments || [];
    
    for (const segment of segments) {
      const chunkText = segment.text.trim();
      if (!chunkText) continue;

      const embeddingResponse = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunkText,
      });

      const embedding = embeddingResponse.data[0].embedding;
      const vectorStr = `[${embedding.join(",")}]`;

      await pool.query(
        `INSERT INTO transcript_chunks (course_id, lesson_id, chunk_text, timestamp_start, embedding)
         VALUES ($1, $2, $3, $4, $5)`,
        [courseId, lessonId, chunkText, Math.floor(segment.start), vectorStr]
      );
    }
  }
}

export const transcriptionService = new TranscriptionService();
