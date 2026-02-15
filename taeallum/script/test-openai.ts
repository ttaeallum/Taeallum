
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

const openaiKey = process.env.OPENAI || process.env.OPENAI_API_KEY;

async function testOpenAI() {
    if (!openaiKey) {
        console.error("❌ OpenAI Key is missing!");
        process.exit(1);
    }

    console.log("Testing OpenAI connection...");
    try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Say hello" }],
        });
        console.log("✅ Connection Successful!");
        console.log("Response:", response.choices[0].message.content);
    } catch (error: any) {
        console.error("❌ Connection Failed!");
        console.error("Error Status:", error?.status);
        console.error("Error Message:", error?.message);
    }
    process.exit(0);
}

testOpenAI();
