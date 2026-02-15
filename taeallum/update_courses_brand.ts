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

        console.log(`Processing ${courseData.length} courses...`);

        for (const data of courseData) {
            const updates: any = {};

            // Update instructor if it looks generic
            if (!data.instructor || data.instructor.includes('نخبة') || data.instructor.includes('خبراء')) {
                if (data.sampleLesson && data.sampleLesson.title) {
                    // Try to extract name after "by" or similar pattern, or just use the channel name if we had it.
                    // Since we only have titles, let's see if the title contains a name or "مهندس" etc.
                    const title = data.sampleLesson.title;
                    if (title.includes(' - ')) {
                        const parts = title.split(' - ');
                        if (parts.length > 1) {
                            // Usually [Course Name] - [Instructor] or vice versa
                            // Fallback for now: use instructor from title if not generic
                        }
                    }
                    // The user specifically said "take from playlist". 
                    // If we had the channel name it would be easier.
                    // Let's look for common patterns in Arabic titles
                }
            }

            // Unique Image Selection
            // We will map course titles/categories to specific Unsplash keywords for variety
            const title = data.title.toLowerCase();
            let theme = 'education';
            if (title.includes('برمجة') || title.includes('python') || title.includes('javascript')) theme = 'coding';
            else if (title.includes('تصميم') || title.includes('design')) theme = 'design';
            else if (title.includes('ذكاء') || title.includes('ai')) theme = 'technology';
            else if (title.includes('تسويق') || title.includes('marketing')) theme = 'business';
            else if (title.includes('هندسة') || title.includes('engineering')) theme = 'engineering';
            else if (title.includes('سحابية') || title.includes('cloud')) theme = 'cloud-computing';

            // Seed the random number with course ID to get consistent but unique images
            const seed = data.id.substring(0, 8);
            updates.thumbnail = `https://images.unsplash.com/photo-1?auto=format&fit=crop&q=80&w=800&sig=${seed}&${theme}`;

            if (Object.keys(updates).length > 0) {
                await db.update(courses).set(updates).where(eq(courses.id, data.id));
                console.log(`Updated course: ${data.title}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
