import { pool, db } from '../db/index';
import { transcriptChunks } from '../db/schema';
import OpenAI from 'openai';
import { getConfig } from '../config';

const openai = new OpenAI({ apiKey: getConfig("OPENAI_API_KEY") });

async function seed() {
  const lessonId = "a17473af-6992-48c9-b016-27635c39ad79";
  const courseId = "69e78087-92c2-4563-833d-56cbc608d551";

  const contents = [
    { start: 0, text: "مرحباً بكم في كورس الـ C++ الاحترافي. في هذا الدرس المقدمة سنتحدث عن أساسيات اللغة وكيفية تثبيت المترجم." },
    { start: 60, text: "لغة C++ هي لغة قوية جداً وتستخدم في بناء الأنظمة الكبيرة والألعاب. سنبدأ بشرح الـ syntax الأساسي." },
    { start: 120, text: "لتثبيت بيئة العمل، ننصح باستخدام VS Code مع إضافة C++ من مايكروسوفت. تأكد من تثبيت GCC أو Clang." },
    { start: 180, text: "البرنامج الأول الخاص بك سيكون 'Hello World'. سنشرح كيفية كتابة هذا البرنامج سطر بسطر." },
  ];

  console.log("Generating embeddings for sample chunks...");

  for (const item of contents) {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: item.text,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // Use raw query for vector insertion
    await pool.query(
      `INSERT INTO transcript_chunks (course_id, lesson_id, chunk_text, timestamp_start, embedding) 
       VALUES ($1, $2, $3, $4, $5)`,
      [courseId, lessonId, item.text, item.start, `[${embedding.join(",")}]`]
    );
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
