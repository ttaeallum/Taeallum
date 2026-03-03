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

            // Curated Unsplash Image IDs by Category
            const imageCollections: any = {
                'coding': [
                    '1587620962725-abab7fe55159', '1461749280684-dccba630e2f6', '1498050108023-c5249f4df085',
                    '1555066931-4365d14bab8c', '1542831280-8da0d56fb312', '1517694712202-14dd9538aa97'
                ],
                'design': [
                    '1561070791-2526d30994b5', '1558655146-d09347e92766', '1509343256512-d77a5cb3791b',
                    '1626785774573-4b799315345d', '1572044162444-ad602119a022', '1611162617474-5b21e879e113'
                ],
                'technology': [
                    '1485827404703-89b55fcc595e', '1620712943543-bcc4688e7485', '1518770660439-4636190af475',
                    '1531297461318-0f8e1393ab75', '1451187580459-43490279c0fa', '1519389950473-47ba0277781c'
                ],
                'business': [
                    '1557804506-669a67965ba0', '1460925895917-afdab827c52f', '1556761175-5973dc0f32e7',
                    '1454165804606-c3d57bc86b40', '1542744173-8e7e53415bb0', '1507679799987-1ae911d37597'
                ],
                'cloud-computing': [
                    '1451187580459-43490279c0fa', '1544197150-b99a580bb7a8', '1592317205836-3914e6b19eb6'
                ],
                'engineering': [
                    '1581091226825-a6a2a5aee158', '1537462715116-402d94c3ba72', '1580894732444-8ecded7900cd'
                ],
                'education': [
                    '1503676260728-1c00da094a0b', '1524178232363-1fb2b075b655', '1497633762265-9d179a990aa6',
                    '1434030216411-0b793f4b4173', '1513258496098-b05360488734'
                ]
            };

            const title = data.title.toLowerCase();
            let theme = 'education';
            if (title.includes('برمجة') || title.includes('python') || title.includes('javascript') || title.includes('web') || title.includes('code') || title.includes('react')) theme = 'coding';
            else if (title.includes('تصميم') || title.includes('design') || title.includes('ui/ux') || title.includes('photoshop')) theme = 'design';
            else if (title.includes('ذكاء') || title.includes('ai') || title.includes('data') || title.includes('بيانات')) theme = 'technology';
            else if (title.includes('تسويق') || title.includes('marketing') || title.includes('business') || title.includes('إدارة')) theme = 'business';
            else if (title.includes('هندسة') || title.includes('engineering') || title.includes('ميكانيك')) theme = 'engineering';
            else if (title.includes('سحابية') || title.includes('cloud') || title.includes('aws') || title.includes('azure')) theme = 'cloud-computing';

            // Pick a random image from the category based on simple number extracted from ID
            const images = imageCollections[theme] || imageCollections['education'];
            const idNum = parseInt(data.id.replace(/\D/g, '').substring(0, 5) || '1', 10); // Extract numbers from ID or default to 1
            const imageId = images[idNum % images.length];

            updates.thumbnail = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&q=80&w=600&h=400`;

            if (Object.keys(updates).length > 0) {
                await db.update(courses).set(updates).where(eq(courses.id, data.id));
                console.log(`Updated course: ${data.title} -> ${theme}`);
            }
        }


        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
