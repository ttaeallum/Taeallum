
import { db } from "../server/db";
import { courses } from "../server/db/schema";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function enhanceCourses() {
    console.log("🚀 Starting Course AI Description Enhancement...");

    const allCourses = await db.select().from(courses);
    console.log(`🔍 Found ${allCourses.length} courses to process.`);

    for (const course of allCourses) {
        console.log(`\n📝 Processing: ${course.title}...`);

        try {
            const prompt = `
                You are a technical curriculum expert for Taeallum (تعلم).
                Enhance the following course description for our Smart Assistant (AI).
                This description will be used by the AI to match this course to student goals.
                
                Course Title: ${course.title}
                Current Description: ${course.description}
                
                Requirements for the enhanced AI Description:
                1. Language: Professional technical Arabic.
                2. Content: Include specific technical keywords, skills learned, target audience depth, and its position in a logical "Zero to Hero" path.
                3. Detail: Be extremely detailed about the syllabus and practical outcomes.
                4. Scale: Define if it's "أساسي" (Foundation), "متوسط" (Intermediate), or "متقدم/احترافي" (Advanced).
                
                Return ONLY the text for the description. No intro, no quotes.
            `;

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
            });

            const enhancedDescription = response.choices[0].message.content?.trim();

            if (enhancedDescription) {
                await db.update(courses)
                    .set({ aiDescription: enhancedDescription })
                    .where(eq(courses.id, course.id));
                console.log(`✅ Success: Updated ${course.title}`);
            }
        } catch (error) {
            console.error(`❌ Error updating ${course.title}:`, error);
        }
    }

    console.log("\n✨ All courses processed successfully!");
    process.exit(0);
}

enhanceCourses().catch(err => {
    console.error(err);
    process.exit(1);
});
