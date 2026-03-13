import * as express from "express";
import { pathAgent, lectureAgent, examAgent } from "../services/agents";
import { extractVideoContent } from "../services/video-agent.service";

const router = express.Router();

// تحويل الفيديو لنص (عند رفع الدرس)
router.post("/transcribe/:lessonId", async (req, res) => {
  try {
    const { videoPath } = req.body;
    const transcript = await extractVideoContent(videoPath);
    // احفظ الـ transcript في DB - يمكنك إضافة الكود هنا لاحقاً
    res.json({ transcript });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agent المسار
router.post("/path", async (req, res) => {
  try {
    const { messages, availableCourses } = req.body;
    const reply = await pathAgent(messages, availableCourses);
    res.json({ reply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agent الدرس
router.post("/lecture", async (req, res) => {
  try {
    const { question, lessonId, lessonName } = req.body;
    // جيب الـ transcript من DB - يتم استبدال هذا لاحقاً بكود قاعدة البيانات
    const transcript = "سيتم إحضار النص هنا لاحقاً"; // مؤقت
    const reply = await lectureAgent(question, transcript, lessonName);
    res.json({ reply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agent الامتحان
router.post("/exam", async (req, res) => {
  try {
    const { courseId, courseName } = req.body;
    // جيب كل transcripts الكورس من DB - يتم استبدال هذا لاحقاً بكود قاعدة البيانات
    const transcript = "سيتم إحضار النص هنا لاحقاً"; // مؤقت
    const exam = await examAgent(transcript, courseName);
    res.json({ exam });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
