
import "dotenv/config";
import OpenAI from "openai";
import { db } from "../server/db";
import { lessons, courses, sections } from "../server/db/schema";
import { eq, sql } from "drizzle-orm";

const getOpenAI = () => {
    let key = process.env.OPENAI_API_KEY || process.env.OPENAI;
    if (!key && process.env.OAI_B64) {
        key = Buffer.from(process.env.OAI_B64, "base64").toString("utf-8");
    }
    if (!key) throw new Error("OpenAI API Key not found");
    return new OpenAI({ apiKey: key });
};

const openai = getOpenAI();

async function enrichCourse(course: any) {
    console.log(`Enriching Course: ${course.title}`);

    // 1. Calculate Duration
    const result = await db.select({
        totalSeconds: sql<number>`COALESCE(SUM(${lessons.duration}), 0)::int`
    })
        .from(lessons)
        .innerJoin(sections, eq(lessons.sectionId, sections.id))
        .where(eq(sections.courseId, course.id));

    const totalSeconds = result[0].totalSeconds || 0;

    // 2. Generate AI Description if missing
    let aiDescription = course.aiDescription;
    let description = course.description;

    if (!aiDescription || aiDescription.length < 10 || !description || description.length < 20) {
        const prompt = `
            أنت خبير في تصميم المناهج التعليمية.
            الهدف: كتابة وصف احترافياً للدورة التدريبية التالية باللغة العربية.
            
            عنوان الدورة: ${course.title}
            الوصف الحالي (إن وجد): ${description || 'لا يوجد'}
            
            المطلوب (JSON):
            - description: وصف شامل وجذاب للطلاب (3-4 جمل).
            - aiDescription: وصف تقني موجه للذكاء الاصطناعي يشرح ماذا يتعلم الطالب في هذه الدورة وكيف يمكن للمساعد الذكي مساعدته.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(completion.choices[0].message.content || "{}");
        description = data.description || description;
        aiDescription = data.aiDescription || aiDescription;
    }

    await db.update(courses)
        .set({
            duration: totalSeconds,
            description,
            aiDescription
        })
        .where(eq(courses.id, course.id));

    console.log(`  ✅ Updated duration to ${totalSeconds}s and descriptions.`);
}

async function enrichLessons() {
    console.log(`\nEnriching Lessons (batch processing)...`);
    const allLessons = await db.select().from(lessons);
    const emptyLessons = allLessons.filter(l => !l.content || l.content.trim().length < 5);

    console.log(`Total lessons: ${allLessons.length}, Empty: ${emptyLessons.length}`);

    // Process in batches of 10 to avoid excessive token usage or timeouts in a single call (though one per call is safer for variety)
    for (let i = 0; i < emptyLessons.length; i++) {
        const lesson = emptyLessons[i];
        process.stdout.write(`[${i + 1}/${emptyLessons.length}] ${lesson.title} ... `);

        const prompt = `
            اكتب وصفاً تعليمياً مختصراً وشيقاً باللغة العربية للدرس التالي بناءً على عنوانه.
            اجعل الوصف 2-3 جمل فقط تصف ما سيتعلمه الطالب.
            عنوان الدرس: ${lesson.title}
            
            أرجع النتيجة بصيغة JSON:
            { "content": "الوصف هنا" }
        `;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });

            const data = JSON.parse(completion.choices[0].message.content || "{}");
            if (data.content) {
                await db.update(lessons)
                    .set({ content: data.content })
                    .where(eq(lessons.id, lesson.id));
                console.log("✅");
            } else {
                console.log("❌ (No content)");
            }
        } catch (err) {
            console.log(`❌ (${(err as any).message})`);
        }
    }
}

async function main() {
    const allCourses = await db.select().from(courses);
    for (const c of allCourses) {
        await enrichCourse(c);
    }

    await enrichLessons();
    console.log("\n--- Enrichment Complete ---");
}

main().catch(console.error).finally(() => process.exit());
