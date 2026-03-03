
import { db } from './server/db';
import { courses } from './server/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
    try {
        const allCourses = await db.select().from(courses);
        console.log(`Processing ${allCourses.length} courses from database...`);

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
            'security': [
                '1563206767-5b1d97287374', '1550751127-147b2ef40467', '1510511459843-be3c1a269f92'
            ],
            'education': [
                '1503676260728-1c00da094a0b', '1524178232363-1fb2b075b655', '1497633762265-9d179a990aa6',
                '1434030216411-0b793f4b4173', '1513258496098-b05360488734'
            ]
        };

        for (const course of allCourses) {
            const title = course.title.toLowerCase();
            let theme = 'education';

            if (title.includes('برمجة') || title.includes('python') || title.includes('javascript') || title.includes('web') || title.includes('code') || title.includes('react') || title.includes('flutter') || title.includes('mern') || title.includes('برمجية')) theme = 'coding';
            else if (title.includes('تصميم') || title.includes('design') || title.includes('ui/ux') || title.includes('photoshop') || title.includes('blender') || title.includes('بصرية')) theme = 'design';
            else if (title.includes('أمن') || title.includes('security') || title.includes('cyber') || title.includes('اختراق') || title.includes('hack') || title.includes('تشفير') || title.includes('cryptography')) theme = 'security';
            else if (title.includes('ذكاء') || title.includes('ai') || title.includes('data') || title.includes('بيانات') || title.includes('learning') || title.includes('vision') || title.includes('nlp')) theme = 'technology';
            else if (title.includes('تسويق') || title.includes('marketing') || title.includes('business') || title.includes('إدارة') || title.includes('ادارة') || title.includes('pmp') || title.includes('agile')) theme = 'business';
            else if (title.includes('هندسة') || title.includes('engineering') || title.includes('ميكانيك') || title.includes('algebra') || title.includes('math') || title.includes('statistics')) theme = 'engineering';
            else if (title.includes('سحابية') || title.includes('cloud') || title.includes('aws') || title.includes('azure')) theme = 'cloud-computing';

            const images = imageCollections[theme] || imageCollections['education'];
            // Use course ID hash to pick a consistent image
            const charSum = course.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const imageId = images[charSum % images.length];

            const thumbnail = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&q=80&w=600&h=400`;

            await db.update(courses).set({ thumbnail }).where(eq(courses.id, course.id));
            console.log(`Updated: ${course.title} -> ${theme}`);
        }

        console.log("Premium branding applied successfully!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
