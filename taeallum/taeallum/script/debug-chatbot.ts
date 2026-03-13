
import { db } from "../server/db";
import { courses, users, subscriptions, aiSessions } from "../server/db/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

const openaiKey = process.env.OPENAI || process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: openaiKey });

async function debugChatbot() {
    console.log("Debugging Chatbot Backend Logic...");

    try {
        // 1. Check Courses
        console.log("Checking courses catalog...");
        const catalog = await db.query.courses.findMany({
            where: eq(courses.isPublished, true),
            with: { category: true }
        });
        console.log(`Found ${catalog.length} published courses.`);

        const courseKnowledge = catalog.map(c =>
            `- ${c.title} (${c.level}): ${c.aiDescription || c.description}`
        ).join("\n");
        console.log(`Course knowledge size: ${courseKnowledge.length} chars.`);

        // 2. Check a Sample Admin User
        const adminEmail = (process.env.ADMIN_EMAIL || "hamzaali200410@gmail.com").toLowerCase();
        console.log(`Checking admin user: ${adminEmail}`);
        const [userRecord] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

        if (!userRecord) {
            console.log("Admin user not found in DB.");
        } else {
            console.log(`Found user: ${userRecord.fullName}, Role: ${userRecord.role}`);
        }

        // 3. Test OpenAI Call with context
        console.log("Testing OpenAI call with full catalog context...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `أنت "المساعد الذكي". الدورات المتاحة:\n${courseKnowledge}`
                },
                { role: "user", content: "ما هي الكورسات المتوفرة؟" }
            ],
        });
        console.log("✅ OpenAI responded successfully!");
        console.log("Reply excerpt:", response.choices[0].message.content?.substring(0, 100) + "...");

    } catch (error: any) {
        console.error("❌ Debugging Failed!");
        console.error(error);
    }
    process.exit(0);
}

debugChatbot();
