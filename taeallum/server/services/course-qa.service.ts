import { pool } from "../db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getConfig } from "../config";

/** Confidence below this: we say "I'm not sure" and still cite source. */
const LOW_CONFIDENCE_THRESHOLD = 0.5;

/** No relevant content found — user-facing message. */
const NO_CONTENT_MESSAGE_AR = "هذا السؤال غير مغطى في محتوى هذه الدورة. جرّب صياغة السؤال بشكل آخر أو الرجوع إلى المحاضرات ذات الصلة.";

/** Low confidence — we answer but clarify we're not certain. */
const LOW_CONFIDENCE_PREFIX_AR = "لست متأكداً أن الإجابة كاملة في الدورة، لكن بناءً على أقرب محتوى متوفر: ";

/** API or processing failure — user-facing message. */
const ERROR_MESSAGE_AR = "عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى لاحقاً.";

export interface QARequest {
  question: string;
  courseId: string;
  lessonId?: string;
}

export interface QAResult {
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

function getGemini(): GoogleGenerativeAI | null {
  try {
    const key = getConfig("GEMINI_API_KEY") || getConfig("OPENAI_API_KEY");
    if (!key) return null;
    return new GoogleGenerativeAI(key);
  } catch {
    return null;
  }
}

/**
 * Formats a citation line: lecture title and timestamp (min:sec).
 */
function formatCitation(lessonTitle: string, timestampStart: number): string {
  const m = Math.floor(timestampStart / 60);
  const s = Math.floor(timestampStart % 60);
  const time = `${m}:${s.toString().padStart(2, "0")}`;
  return `(المصدر: المحاضرة «${lessonTitle}» — الدقيقة ${time})`;
}

/**
 * Answers a student's question about a course using vector search on transcript chunks
 * and Gemini. Returns a graceful Arabic message when no content is found or confidence
 * is low; always cites lecture and timestamp when an answer is given.
 */
export async function askCourseQuestion(req: QARequest): Promise<QAResult> {
  const { question, courseId, lessonId } = req;
  const genAI = getGemini();
  if (!genAI) {
    return { answer: ERROR_MESSAGE_AR, confidence: 0 };
  }

  // 1. Generate embedding for the question
  let embedding: number[];
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(question);
    embedding = result.embedding.values;
  } catch (e) {
    console.error("[COURSE_QA] Embedding failed", e);
    return { answer: ERROR_MESSAGE_AR, confidence: 0 };
  }

  const vectorStr = `[${embedding.join(",")}]`;

  // 2. Vector search for top 5 chunks
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

  // 3. Build context and citation (lecture + timestamp for each chunk)
  const contextText = chunks
    .map(
      (c: TranscriptChunkRow) =>
        `المحاضرة: ${c.lesson_title}\nالوقت: ${Math.floor(c.timestamp_start / 60)}:${(c.timestamp_start % 60).toString().padStart(2, "0")}\nالنص: ${c.chunk_text}`
    )
    .join("\n\n---\n\n");

  const systemInstruction = `أنت مساعد تعليمي لمنصة taallm.com. أجب على سؤال الطالب من محتوى الدورة المزود فقط.
إذا السؤال غير موجود في المحتوى المزود فقل بوضوح: "هذا السؤال غير مغطى في الدورة."
في نهاية كل إجابة، اذكر دائماً رقم المحاضرة (أو عنوانها) والدقيقة:ثانية بشكل واضح، مثال: (المصدر: المحاضرة «عنوان المحاضرة» — الدقيقة 5:30).
تحدث باللغة العربية بلهجة ودودة ومهنية.`;

  const userPrompt = `محتوى الدورة التعليمي:
${contextText}

سؤال الطالب: ${question}`;

  const callGemini = async (): Promise<string> => {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });
    const result = await model.generateContent(userPrompt);
    const content = result.response.text();
    if (!content || typeof content !== "string") throw new Error("Empty Gemini response");
    return content;
  };

  let answer: string;
  try {
    answer = await callGemini();
  } catch (e) {
    console.error("[COURSE_QA] Gemini first attempt failed", e);
    try {
      answer = await callGemini();
    } catch (retryErr) {
      console.error("[COURSE_QA] Gemini retry failed", retryErr);
      return { answer: ERROR_MESSAGE_AR, confidence: topConfidence };
    }
  }

  // Ensure citation is present: lecture and timestamp
  const topChunk = chunks[0];
  const citation = formatCitation(topChunk.lesson_title, topChunk.timestamp_start);
  if (!answer.trim().includes("المصدر:") && !answer.trim().includes("الدقيقة")) {
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
}

