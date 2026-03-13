import { geminiPro, geminiEmbed } from "./gemini";
import { pool } from "../db";

/**
 * LectureAgent — Phase 2: Lesson Q&A context fetching and interaction
 * 
 * Provides contextual answers based on video transcriptions using Google Gemini.
 */

export interface LectureQARequest {
  question: string;
  courseId: string;
  lessonId?: string;
}

export interface LectureQAResult {
  answer: string;
  source_lesson?: string;
  timestamp?: number;
  confidence: number;
}

interface TranscriptChunkRow {
  chunk_text: string;
  timestamp_start: number;
  lesson_id: string;
  lesson_title: string;
  confidence: number;
}

const LOW_CONFIDENCE_THRESHOLD = 0.5;
const NO_CONTENT_MESSAGE_AR = "هذا السؤال غير مغطى في محتوى هذه الدورة. جرّب صياغة السؤال بشكل آخر أو الرجوع إلى المحاضرات ذات الصلة.";
const LOW_CONFIDENCE_PREFIX_AR = "لست متأكداً أن الإجابة كاملة في الدورة، لكن بناءً على أقرب محتوى متوفر: ";
const ERROR_MESSAGE_AR = "عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى لاحقاً.";

export class LectureAgent {
  private formatCitation(lessonTitle: string, timestampStart: number): string {
    const m = Math.floor(timestampStart / 60);
    const s = Math.floor(timestampStart % 60);
    const time = `${m}:${s.toString().padStart(2, "0")}`;
    return `(المصدر: المحاضرة «${lessonTitle}» — الدقيقة ${time})`;
  }

  async ask(req: LectureQARequest): Promise<LectureQAResult> {
    const { question, courseId, lessonId } = req;

    try {
      // 1. Generate embedding using Gemini
      const embeddingResult = await geminiEmbed.embedContent(question);
      const embedding = embeddingResult.embedding.values;
      const vectorStr = `[${embedding.join(",")}]`;

      // 2. Vector search (pgvector handles the comparison)
      // Note: We use the same SQL but the dimensions must match (handled at storage time)
      const contextResults = await pool.query<TranscriptChunkRow>(
        `
        SELECT 
          tc.chunk_text, 
          tc.timestamp_start, 
          tc.lesson_id,
          l.title as lesson_title,
          1 - (tc.embedding <=> $1) as confidence
        FROM transcript_chunks tc
        JOIN lessons l ON l.id = tc.lesson_id
        WHERE tc.course_id = $2
        ${lessonId ? "AND tc.lesson_id = $3" : ""}
        ORDER BY tc.embedding <=> $1
        LIMIT 5
      `,
        lessonId ? [vectorStr, courseId, lessonId] : [vectorStr, courseId]
      );

      const chunks = contextResults.rows;

      if (chunks.length === 0) {
        return { answer: NO_CONTENT_MESSAGE_AR, confidence: 0 };
      }

      const topConfidence = chunks[0].confidence;
      if (topConfidence < 0.1) {
        return { answer: NO_CONTENT_MESSAGE_AR, confidence: topConfidence };
      }

      // 3. Build context
      const contextText = chunks
        .map(
          (c: TranscriptChunkRow) =>
            `المحاضرة: ${c.lesson_title}\nالوقت: ${Math.floor(c.timestamp_start / 60)}:${(c.timestamp_start % 60).toString().padStart(2, "0")}\nالنص: ${c.chunk_text}`
        )
        .join("\n\n---\n\n");

      const systemPrompt = `أنت مساعد تعليمي صارم لمنصة taallm.com.

## مصدر معرفتك الوحيد:
نص المحاضرة الموجود أدناه فقط. ليس لديك أي مصدر معرفة آخر.

## قواعد صارمة:
1. أجب فقط من النص المقدم — لا شيء غير ذلك.
2. إذا لم تكن الإجابة موجودة في النص، فقل بالضبط:
   "هاد السؤال ما إلو جواب بمحتوى هاد الدرس. راجع المحاضرة أو اسأل المدرب مباشرة."
3. لا تستخدم أبداً معرفتك العامة، حتى لو كنت تعرف الإجابة.
4. لا تقل أبداً "بناءً على معرفتي" أو أي شيء مشابه.
5. اجعل الإجابات مختصرة وواضحة.
6. الرد دائماً باللغة العربية.
7. إذا كان ذلك مناسباً، اذكر الوقت التقريبي من المحاضرة.`;

      const userPrompt = `## نص المحاضرة:
${contextText}

## اسم الكورس: ${req.courseId}
## اسم الدرس: ${lessonId || "الدرس الحالي"}

## سؤال الطالب:
${question}`;

      const result = await geminiPro.generateContent({
        contents: [
          { role: "user", parts: [{ text: `System: ${systemPrompt}\n\n${userPrompt}` }] }
        ],
        generationConfig: { temperature: 0 }
      });

      let answer = result.response.text() || "";
      
      // Post-process citation
      const topChunk = chunks[0];
      const citation = this.formatCitation(topChunk.lesson_title, topChunk.timestamp_start);
      if (!answer.includes("المصدر:") && !answer.includes("الدقيقة")) {
        answer = `${answer.trim()}\n\n${citation}`;
      }

      if (topConfidence < LOW_CONFIDENCE_THRESHOLD) {
        answer = `${LOW_CONFIDENCE_PREFIX_AR}${answer}`;
      }

      return {
        answer,
        source_lesson: topChunk.lesson_title,
        timestamp: topChunk.timestamp_start,
        confidence: topConfidence,
      };

    } catch (e) {
      console.error("[LECTURE_AGENT] Error:", e);
      return { answer: ERROR_MESSAGE_AR, confidence: 0 };
    }
  }
}

export const lectureAgent = new LectureAgent();
