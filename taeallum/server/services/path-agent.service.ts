import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { getConfig } from "../config";
import { db } from "../db";
import { courses, aiSessions, aiMessages, studyPlans } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { pool } from "../db";
import crypto from "crypto";

/**
 * PathAgent — Phase 1: User Onboarding and Course Path generation
 * 
 * Guided conversation to build a personalized learning path.
 * Strict rules: Arabic response, one question at a time, only available courses.
 */

export interface PathAgentResponse {
  message: string;
  suggestions: string[];
  action: "ask" | "build_plan" | "redirect";
  learning_path?: any;
}

export class PathAgent {
  private genAI: GoogleGenerativeAI | null;

  constructor() {
    const key = getConfig("GEMINI_API_KEY") || getConfig("OPENAI_API_KEY"); // Fallback for transition
    this.genAI = key ? new GoogleGenerativeAI(key) : null;
  }

  /**
   * Main turn handler for the Path Agent.
   */
  async process(userId: string, sessionId: string, userMessage: string): Promise<PathAgentResponse> {
    if (!this.genAI) {
      throw new Error("Gemini API key not configured");
    }

    // 1. Fetch available courses
    const availableCourses = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
    }).from(courses).where(eq(courses.isPublished, true));

    const coursesListText = availableCourses.map(c => `- ID: ${c.id} | Name: ${c.title}`).join("\n");

    // 2. Fetch conversation history
    const history = await db.select()
      .from(aiMessages)
      .where(eq(aiMessages.sessionId, sessionId))
      .orderBy(aiMessages.createdAt);

    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `You are an intelligent learning path advisor for taallm.com, an Arabic e-learning platform.

## Your Mission:
Guide the student through a series of questions to build a PERSONALIZED learning path using ONLY the available courses on the platform.

## Available Courses:
${coursesListText}

## Conversation Rules:
1. Ask ONE question at a time — never multiple questions together.
2. Questions must determine:
   - Current skill level (beginner / intermediate / advanced)
   - Learning goal (what do they want to build or achieve?)
   - Available time per week (hours)
   - Preferred learning style (theory-first or project-first)
3. After 4-5 questions, generate the learning path.
4. The path must ONLY include courses from the platform list above.
5. Explain WHY each course is included in the path.
6. ALWAYS respond in Arabic.

## Output Format (during collection):
Respond with a normal Arabic message. You can optionally include suggestions in the format: [SUGGESTIONS: choice1 | choice2 | choice3]

## Output Format (after collecting info - final generation):
Respond ONLY with a JSON object:
{
  "learning_path": [
    {
      "order": 1,
      "course_id": "...",
      "course_name": "...",
      "reason": "ليش هاد الكورس مناسب للطالب",
      "estimated_weeks": 2
    }
  ],
  "total_duration": "X أسابيع",
  "encouragement_message": "رسالة تحفيزية شخصية"
}`,
    });

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
    });

    // 3. Call Gemini
    const result_ai = await chat.sendMessage(userMessage);
    const aiContent = result_ai.response.text() || "";

    // 4. Parse response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const pathData = JSON.parse(jsonMatch[0]);
        if (pathData.learning_path) {
          // Transition to plan_ready
          // Store in learning_paths table (Phase 1 specific)
          await pool.query(
            `INSERT INTO learning_paths (id, user_id, path_data, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [crypto.randomUUID(), userId, JSON.stringify(pathData)]
          );

          return {
            message: "رائع! لقد قمت بإنشاء خطتك الدراسية المخصصة.",
            suggestions: ["عرض خطتي الدراسية 🎯", "ابدأ التعلم الآن 🚀"],
            action: "build_plan",
            learning_path: pathData
          };
        }
      } catch (e) {
        // Not valid JSON, treat as message
      }
    }

    // Check for suggestions in text
    const suggestionsMatch = aiContent.match(/\[SUGGESTIONS:\s*([^\]]+)\]/i);
    let suggestions: string[] = [];
    let cleanMessage = aiContent;

    if (suggestionsMatch) {
      suggestions = suggestionsMatch[1].split("|").map(s => s.trim());
      cleanMessage = aiContent.replace(/\[SUGGESTIONS:[^\]]+\]/gi, "").trim();
    } else {
      // Default suggestions based on context if possible, or none
      if (cleanMessage.includes("مستوى") || cleanMessage.includes("خبرة")) {
        suggestions = ["مبتدئ", "متوسط", "متقدم"];
      } else if (cleanMessage.includes("ساعة")) {
        suggestions = ["5 ساعات", "10 ساعات", "20 ساعة"];
      }
    }

    return {
      message: cleanMessage,
      suggestions: suggestions,
      action: "ask"
    };
  }
}

export const pathAgent = new PathAgent();
