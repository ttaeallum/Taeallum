import { geminiPro } from "./gemini";
import { pool } from "../db";
import crypto from "crypto";

/**
 * ExamAgent — Phase 3: Dynamic Quiz generation based on Video content
 * 
 * Generates MCQs by analyzing transcriptions of a course or section using Google Gemini.
 */

export interface ExamQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GeneratedExam {
  examId: string;
  courseId: string;
  title: string;
  questions: ExamQuestion[];
}

export class ExamAgent {
  /**
   * Generates a practical exam based STRICTLY on the course content.
   */
  async generateQuiz(courseId: string, courseName: string = "الكورس"): Promise<any> {
    // 1. Fetch transcripts
    const transcriptResults = await pool.query(
      `SELECT chunk_text FROM transcript_chunks WHERE course_id = $1 LIMIT 30`,
      [courseId]
    );

    const context = transcriptResults.rows.map(r => r.chunk_text).join("\n\n");

    if (!context) {
      throw new Error("No transcripts found for this course. Cannot generate exam.");
    }

    // 2. Call Gemini
    const systemPrompt = `أنت مولد امتحانات لمنصة taallm.com.

## مهمتك:
توليد امتحان عملي بناءً على محتوى الكورس أدناه بشكل صارم.

## قواعد الامتحان:
1. توليد 10 أسئلة بالضبط.
2. مزيج من أنواع الأسئلة:
   - 4 اختيار من متعدد - type: "multiple_choice"
   - 3 صح أو غلط - type: "true_false"
   - 2 إجابة قصيرة - type: "short_answer"
   - 1 مهمة عملية - type: "practical_task"
3. يجب أن تأتي جميع الأسئلة مباشرة من محتوى الكورس.
4. لا توجد أسئلة حول مواضيع لم يتم تغطيتها في الكورس.
5. تضمين الإجابة الصحيحة لكل سؤال.
6. الرد دائماً باللغة العربية.

## تنسيق المخرجات:
رد فقط باستخدام بنية JSON هذه:
{
  "exam_title": "امتحان كورس ${courseName}",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "...",
      "options": ["أ", "ب", "ج", "د"],
      "correct_answer": "أ",
      "explanation": "لأن..."
    }
  ]
}`;

    const userPrompt = `## نص/محتوى الكورس:
${context}

## اسم الكورس: ${courseName}

قم بتوليد الاختبار الآن.`;

    const result = await geminiPro.generateContent({
      contents: [
        { role: "user", parts: [{ text: `System: ${systemPrompt}\n\n${userPrompt}` }] }
      ],
      generationConfig: { 
        temperature: 0.5,
        responseMimeType: "application/json"
      }
    });

    const content = result.response.text() || "{}";
    const examData = JSON.parse(content);

    // 3. Save to exams table
    const userId = (global as any).currentUserId || null; 
    if (userId) {
        await pool.query(
            `INSERT INTO exams (id, user_id, course_id, questions, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [crypto.randomUUID(), userId, courseId, JSON.stringify(examData.questions)]
        );
    }

    return examData;
  }
}

export const examAgent = new ExamAgent();
