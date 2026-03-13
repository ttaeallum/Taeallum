import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { requireAuth } from "./auth";
import { db } from "../db";
import {
    users,
    students,
    studentPerformance,
    quizSubmissions,
    enrollments,
    lessons,
    courses,
    quizzes
} from "../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getConfig } from "../config";

const router = Router();

const getOpenAI = () => {
    try {
        const key = getConfig("OPENAI_API_KEY");
        if (!key) return null;
        return new OpenAI({ apiKey: key });
    } catch (err) {
        return null;
    }
};

import { sendEducationalNudge } from "../lib/email";

/**
 * AI Analysis Agent: Evaluates student performance and adapts the path
 */
router.post("/analyze-performance", requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).session.userId;
        const openai = getOpenAI();

        if (!openai) return res.status(500).json({ message: "AI Configuration missing" });

        // 1. Gather Student Data
        const [studentProfile] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
        const userEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId));
        const submissions = await db.select()
            .from(quizSubmissions)
            .where(eq(quizSubmissions.userId, userId))
            .orderBy(desc(quizSubmissions.createdAt))
            .limit(10);

        // Fetch completed lesson titles
        const doneLessons = await db.execute(sql`
            SELECT count(*) as count FROM quiz_submissions 
            WHERE user_id = ${userId} AND score >= 70
        `);

        // 2. Prepare Data for AI
        const analysisContext = {
            profile: studentProfile,
            progress: userEnrollments.map(e => ({ courseId: e.courseId, progress: e.progress })),
            recentQuizResults: submissions.map(s => ({ score: s.score, quizId: s.quizId }))
        };

        // 3. Call AI to Analyze & Adapt
        const prompt = `
            Analyze this student's learning performance for the 'taallm' (تعلم) platform.
            
            Context:
            ${JSON.stringify(analysisContext, null, 2)}

            GOAL: Adapt the learning path and provide a nudge.
            1. Evaluate if they are Ready for 'Advanced' or need 'Review'.
            2. Identify 3 strengths/weaknesses.
            3. Recommend the EXACT next lesson type (Video/Quiz/Project).
            4. Write a 2-sentence personal Arabic encouragement message.

            RETURN JSON:
            {
                "level": "Beginner|Intermediate|Advanced",
                "strengths": [], "weaknesses": [],
                "next_recommendation": "text",
                "nudge_type": "congrats|reminder|recommendation",
                "nudge_content": "arabic text",
                "adaptive_notes": "logic for engine"
            }
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: "Educational AI Agent" }, { role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0].message.content || "{}");

        // 4. Update Database (Sync Performance & adaptive path)
        await db.insert(studentPerformance)
            .values({
                userId: userId,
                strengths: analysis.strengths,
                weaknesses: analysis.weaknesses,
                adaptiveNotes: analysis.adaptive_notes,
                lastAiAnalysisAt: new Date()
            })
            .onConflictDoUpdate({
                target: studentPerformance.userId,
                set: {
                    strengths: analysis.strengths,
                    weaknesses: analysis.weaknesses,
                    adaptiveNotes: analysis.adaptive_notes,
                    updatedAt: new Date(),
                    lastAiAnalysisAt: new Date()
                }
            });

        // Sync to Student Master Table
        const currentCompleted = (studentProfile?.completedLessons as any[]) || [];
        const lastQuiz = submissions[0];
        if (lastQuiz && lastQuiz.score >= 70) {
            // Logic to add 'lesson_id' to completed if it was a passing grade
            // For now we trust the analysis to suggest next steps
        }

        await db.update(students)
            .set({
                ageLevel: analysis.level,
                quizPerformance: `Score: ${lastQuiz?.score || 0}%, Status: ${analysis.level}`,
                notes: analysis.next_recommendation,
                updatedAt: new Date()
            })
            .where(eq(students.userId, userId));

        // 5. Trigger Nudge (Email)
        if (studentProfile?.email) {
            await sendEducationalNudge(
                studentProfile.email,
                studentProfile.name,
                analysis.nudge_type as any,
                analysis.nudge_content
            );
        }

        res.json({ success: true, analysis });

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ success: false });
    }
});

/**
 * Get Personalized Next Steps
 */
router.get("/recommendations", requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).session.userId;
        const [performance] = await db.select().from(studentPerformance).where(eq(studentPerformance.userId, userId)).limit(1);

        if (!performance) {
            return res.json({ message: "برجاء إكمال بعض الدروس والكويزات أولاً لنتمكن من تحليلك." });
        }

        res.json({
            strengths: performance.strengths,
            weaknesses: performance.weaknesses,
            aiNotes: performance.adaptiveNotes
        });
    } catch (error) {
        res.status(500).json({ message: "Internal error" });
    }
});

export default router;
