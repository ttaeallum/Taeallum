import { db, pool } from "../db";
import { transcriptChunks, lessons } from "../db/schema";
import { eq, sql, and } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI();

export interface QARequest {
    question: string;
    courseId: string;
    lessonId?: string;
}

export async function askCourseQuestion(req: QARequest) {
    const { question, courseId, lessonId } = req;

    // 1. Generate embedding for the question
    const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: question,
    });
    const embedding = embeddingResponse.data[0].embedding;
    const vectorStr = `[${embedding.join(",")}]`;

    // 2. Vector search for top 5 chunks
    // We use raw SQL for the vector comparison since Drizzle doesn't have native <=> yet
    // We also join with lessons to get the lesson title
    const contextResults = await pool.query(`
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
  `, lessonId ? [vectorStr, courseId, lessonId] : [vectorStr, courseId]);

    const chunks = contextResults.rows;

    if (chunks.length === 0 || chunks[0].confidence < 0.1) {
        return {
            answer: "هاد السؤال مش مغطى بالدورة.",
            confidence: chunks.length > 0 ? chunks[0].confidence : 0,
        };
    }

    // 3. Prepare context for GPT-4o
    const contextText = chunks.map((c: any) =>
        `المحاضرة: ${c.lesson_title}\nالوقت: ${Math.floor(c.timestamp_start / 60)}:${(c.timestamp_start % 60).toString().padStart(2, '0')}\nالنص: ${c.chunk_text}`
    ).join("\n\n---\n\n");

    const systemPrompt = `أنت مساعد تعليمي لمنصة taallm.com. أجب على سؤال الطالب من محتوى الدورة المزود فقط.
إذا السؤال مش موجود بالمحتوى المزود قل تماماً: "هاد السؤال مش مغطى بالدورة."
دائماً اذكر رقم المحاضرة (أو عنوانها) والدقيقة اللي جاء منها الجواب بشكل واضح في نهاية إجابتك.
تحدث باللغة العربية بلهجة ودودة ولكن مهنية.`;

    const userPrompt = `محتوى الدورة التعليمي:
${contextText}

سؤال الطالب: ${question}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
    });

    const answer = completion.choices[0].message.content;

    return {
        answer,
        source_lesson: chunks[0].lesson_title,
        timestamp: chunks[0].timestamp_start,
        confidence: chunks[0].confidence,
    };
}
