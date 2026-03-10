/**
 * QuizEngine — generates and evaluates post-course quizzes
 *
 * Flow:
 *   1. generateQuiz(courseId) → 5 MCQ questions from AI based on course title/description
 *   2. evaluateSubmission(answers) → score 0–100
 *      - Pass (≥70%): returns { passed: true, nextCourse }
 *      - Fail (<70%): returns { passed: false, weakTopics, reviewFocus }
 *   3. Results stored in quiz_submissions table for ProgressTracker
 */

import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "../config";
import { db } from "../db";
import { courses, quizzes, quizSubmissions, studyPlans } from "../db/schema";
import { eq, desc } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;              // q1, q2, ... q5
  question: string;        // Arabic question text
  options: string[];       // 4 options A-D
  correctIndex: number;    // 0-3
  topic: string;           // topic this question covers (for weak-point detection)
  explanation: string;     // explanation of the correct answer (shown on fail)
}

export interface GeneratedQuiz {
  quizId: string;
  courseId: string;
  courseTitle: string;
  questions: QuizQuestion[];
  difficulty: string;
}

export interface QuizResult {
  score: number;           // 0–100
  passed: boolean;         // score >= 70
  correctCount: number;
  totalQuestions: number;
  weakTopics: string[];    // topics where student failed
  feedback: string;        // personalised Arabic feedback
  nextAction: "advance" | "review";
  reviewFocus?: string;    // what to re-study if failed
}

// ─── AI client ────────────────────────────────────────────────────────────────

function getAnthropic(): Anthropic {
  const key = getConfig("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY not configured");
  return new Anthropic({ apiKey: key });
}

// ─── Generate quiz ─────────────────────────────────────────────────────────────

export async function generateQuiz(courseId: string): Promise<GeneratedQuiz> {
  // 1. Fetch course details
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: { category: true, sections: { with: { lessons: true } } },
  });

  if (!course) throw new Error(`Course ${courseId} not found`);

  // 2. Build context from course content
  const lessonTitles = (course as any).sections
    ?.flatMap((s: any) => s.lessons?.map((l: any) => l.title) || [])
    .slice(0, 20)
    .join(", ") || "General course topics";

  const anthropic = getAnthropic();

  const prompt = `Generate exactly 5 multiple-choice quiz questions for this course:

Course: "${course.title}"
Category: ${(course as any).category?.name || "Computer Science"}
Level: ${course.level}
Topics covered: ${lessonTitles}
Description: ${course.description}

Requirements:
- All questions and options MUST be in Arabic
- Each question tests genuine understanding (not just memorization)
- Cover 5 different sub-topics within the course
- Questions should be at the course's difficulty level (${course.level})
- 4 options each, exactly one correct

Return ONLY this JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "Arabic question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "topic": "sub-topic this question covers",
      "explanation": "Arabic explanation of why this answer is correct"
    }
  ],
  "difficulty": "${course.level}"
}`;

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (resp.content[0] as any).text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned no JSON for quiz");

  const parsed = JSON.parse(match[0]);

  // 3. Save quiz to DB (linked to a lesson if possible, else use courseId as key)
  const firstLesson = (course as any).sections?.[0]?.lessons?.[0];

  let quizRecord: any = null;
  if (firstLesson?.id) {
    // Check if quiz already exists for this lesson
    const existing = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, firstLesson.id))
      .limit(1);

    if (existing.length > 0) {
      quizRecord = existing[0];
      // Update with fresh questions
      await db
        .update(quizzes)
        .set({ questions: parsed.questions as any, difficulty: parsed.difficulty })
        .where(eq(quizzes.id, existing[0].id));
    } else {
      [quizRecord] = await db
        .insert(quizzes)
        .values({
          lessonId: firstLesson.id,
          questions: parsed.questions as any,
          difficulty: parsed.difficulty || "intermediate",
        })
        .returning();
    }
  }

  return {
    quizId: quizRecord?.id || `temp-${courseId}`,
    courseId,
    courseTitle: course.title,
    questions: parsed.questions,
    difficulty: parsed.difficulty || course.level,
  };
}

// ─── Evaluate submission ───────────────────────────────────────────────────────

export async function evaluateQuiz(
  userId: string,
  quizId: string,
  courseId: string,
  userAnswers: number[],   // array of chosen option indices per question
  questions: QuizQuestion[]
): Promise<QuizResult> {

  if (userAnswers.length !== questions.length) {
    throw new Error("Answer count does not match question count");
  }

  // 1. Score
  let correct = 0;
  const weakTopics: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    if (userAnswers[i] === questions[i].correctIndex) {
      correct++;
    } else {
      weakTopics.push(questions[i].topic);
    }
  }

  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= 70;

  // 2. Generate personalised Arabic feedback via AI
  const anthropic = getAnthropic();
  const feedbackPrompt = `A student just completed a quiz for a programming course.

Results:
- Score: ${score}/100 (${correct}/${questions.length} correct)
- Status: ${passed ? "PASSED ✅" : "FAILED ❌"}
- Weak topics: ${weakTopics.join(", ") || "None"}

Write a short (3–4 sentences), encouraging Arabic feedback message for the student.
${passed
  ? "Congratulate them warmly and motivate them to continue to the next course."
  : "Be supportive, mention exactly which topics to review, and encourage them to try again after reviewing."}

Return ONLY the Arabic feedback text (no JSON, no extra formatting).`;

  let feedback = "";
  try {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{ role: "user", content: feedbackPrompt }],
    });
    feedback = (resp.content[0] as any).text?.trim() || "";
  } catch {
    feedback = passed
      ? `أحسنت! حصلت على ${score}% وتجاوزت الاختبار. انتقل للكورس التالي.`
      : `حصلت على ${score}%. يرجى مراجعة المواضيع التالية: ${weakTopics.join("، ")} ثم حاول مرة أخرى.`;
  }

  // 3. Save submission to DB
  try {
    const quizRecord = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (quizRecord.length > 0) {
      await db.insert(quizSubmissions).values({
        userId,
        quizId,
        score,
        answers: userAnswers as any,
        feedback,
      });
    }
  } catch (e) {
    console.error("[QUIZ] Failed to save submission:", e);
  }

  // 4. Build result
  const result: QuizResult = {
    score,
    passed,
    correctCount: correct,
    totalQuestions: questions.length,
    weakTopics,
    feedback,
    nextAction: passed ? "advance" : "review",
    reviewFocus: passed
      ? undefined
      : `راجع هذه المواضيع: ${weakTopics.join("، ")}`,
  };

  return result;
}

// ─── Advance plan pointer after passing ───────────────────────────────────────

export async function advancePlanAfterPass(
  userId: string,
  completedCourseId: string
): Promise<{ nextCourseId: string | null; nextCourseTitle: string | null; planComplete: boolean }> {

  // Find the user's active plan
  const [plan] = await db
    .select()
    .from(studyPlans)
    .where(eq(studyPlans.userId, userId))
    .orderBy(desc(studyPlans.createdAt))
    .limit(1);

  if (!plan) return { nextCourseId: null, nextCourseTitle: null, planComplete: false };

  const planData = plan.planData as any;
  const allCourses: Array<{ id: string; title: string }> = (planData.milestones || [])
    .flatMap((m: any) => m.courses || []);

  const currentIdx = allCourses.findIndex(c => c.id === completedCourseId);
  if (currentIdx === -1) return { nextCourseId: null, nextCourseTitle: null, planComplete: false };

  const nextCourse = allCourses[currentIdx + 1];
  const planComplete = !nextCourse;

  // Update plan progress percentage
  const progress = Math.round(((currentIdx + 1) / allCourses.length) * 100);
  await db
    .update(studyPlans)
    .set({ progress, updatedAt: new Date() })
    .where(eq(studyPlans.id, plan.id));

  if (planComplete) {
    await db
      .update(studyPlans)
      .set({ status: "completed", progress: 100, updatedAt: new Date() })
      .where(eq(studyPlans.id, plan.id));
  }

  return {
    nextCourseId: nextCourse?.id || null,
    nextCourseTitle: nextCourse?.title || null,
    planComplete,
  };
}
