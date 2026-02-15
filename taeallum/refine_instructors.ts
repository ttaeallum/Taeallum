import { db } from './server/db';
import { courses } from './server/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function run() {
    try {
        const rawContent = fs.readFileSync('course_details_utf8.json', 'utf16le');
        const startMarker = '---START_COURSE_DATA---';
        const endMarker = '---END_COURSE_DATA---';
        const start = rawContent.indexOf(startMarker) + startMarker.length;
        const end = rawContent.indexOf(endMarker);
        const jsonStr = rawContent.substring(start, end).trim();
        const courseData = JSON.parse(jsonStr);

        console.log(`Refining instructors for ${courseData.length} courses...`);

        for (const data of courseData) {
            const updates: any = {};
            const lessonTitle = (data.sampleLesson && data.sampleLesson.title) || '';
            const courseTitle = data.title || '';

            // Instructor Mapping based on common patterns
            if (lessonTitle.includes('وليد طه')) {
                updates.instructor = 'وليد طه';
            } else if (lessonTitle.includes('Ahmad Al-Mashaikh')) {
                updates.instructor = 'م. أحمد المشايخ';
            } else if (courseTitle.includes('الإنجليزية') || lessonTitle.includes('English')) {
                updates.instructor = 'إبراهيم عادل (ZAmericanEnglish)';
            } else if (courseTitle.includes('Node.js') || courseTitle.includes('Python') || courseTitle.includes('أساسيات البرمجة')) {
                updates.instructor = 'م. أسامة الزيرو';
            } else if (courseTitle.includes('Unity') || courseTitle.includes('After Effects')) {
                updates.instructor = 'نخبة من خبراء الموشن جرافيك';
            } else if (courseTitle.includes('Cyber Security') || courseTitle.includes('الأمن السيبراني')) {
                updates.instructor = 'م. سيف بن عمار'; // Common instructor for Arabic CyberSec
            }

            if (Object.keys(updates).length > 0) {
                await db.update(courses).set(updates).where(eq(courses.id, data.id));
                console.log(`Refined instructor for: ${courseTitle} -> ${updates.instructor}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
