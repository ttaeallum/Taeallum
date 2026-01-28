import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openaiKey = process.env.OPENAI || process.env.OPENAI_API_KEY;
const openai = openaiKey
    ? new OpenAI({ apiKey: openaiKey })
    : null;

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;

        if (!openai) {
            return res.status(400).json({ message: "OpenAI is not configured" });
        }

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o", // or your preferred model
            messages: [
                {
                    role: "system",
                    content: "أنت مساعد ذكي لمنصة 'تعلم' (Taeallum). ساعد الطلاب في الإجابة على أسئلتهم حول البرمجة، التقنية، والتصميم بأسلوب ودود وباللغة العربية."
                },
                { role: "user", content: message }
            ],
        });

        res.json({ reply: response.choices[0].message.content });
    } catch (error: any) {
        console.error("OpenAI Error:", error);
        res.status(500).json({ message: "حدث خطأ أثناء التواصل مع المساعد الذكي" });
    }
});

export default router;
