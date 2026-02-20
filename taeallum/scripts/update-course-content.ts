
import { db } from "../server/db";
import { courses } from "../server/db/schema";
import { eq } from "drizzle-orm";

const mappings: { keywords: string[], image: string, level?: string }[] = [
    {
        keywords: ["React", "Next.js", "Frontend"],
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
        level: "intermediate"
    },
    {
        keywords: ["Python", "Django", "Flask", "علوم البيانات", "الذكاء الاصطناعي"],
        image: "https://images.unsplash.com/photo-1649180556628-9ba704115795?w=800&auto=format&fit=crop&q=60",
        level: "advanced"
    },
    {
        keywords: ["Java ", "Spring"],
        image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=60",
    },
    {
        keywords: ["JavaScript", "JS", "Node"],
        image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop&q=60",
    },
    {
        keywords: ["HTML", "CSS", "Web Design", "تصميم"],
        image: "https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800&auto=format&fit=crop&q=60",
        level: "beginner"
    },
    {
        keywords: ["UI", "UX", "Design", "الهوية البصرية", "الهويات"],
        image: "https://images.unsplash.com/photo-1586717791821-3f44a5638d0f?w=800&auto=format&fit=crop&q=60",
    },
    {
        keywords: ["Data", "Analysis", "SQL"],
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
    },
    {
        keywords: ["Machine Learning", "AI", "Artificial Intelligence"],
        image: "https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=800&auto=format&fit=crop&q=60",
        level: "advanced"
    },
    {
        keywords: ["Marketing", "Digital", "SEO", "التسويق"],
        image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&auto=format&fit=crop&q=60",
    },
    {
        keywords: ["Business", "Management", "Finance", "إدارة", "التداول", "دروبشيبينغ"],
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60",
    },
    {
        keywords: ["Software", "Engineering", "هندسة البرمجيات", "Cloud", "الحوسبة السحابية"],
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60",
        level: "advanced"
    },
    {
        keywords: ["Security", "Penetration", "اختبار اختراق", "أمن"],
        image: "https://images.unsplash.com/photo-1563206767-5b1d97287374?w=800&auto=format&fit=crop&q=60",
        level: "advanced"
    },
    {
        keywords: ["Laravel", "PHP"],
        image: "https://images.unsplash.com/photo-1599507593499-a3f7d7d97663?w=800&auto=format&fit=crop&q=60",
        level: "intermediate"
    }
];

const levelKeywords = {
    beginner: ["Introduction", "Basics", "Fundamentals", "Beginner", "Start", "Zero", "أساسيات", "مقدمة"],
    advanced: ["Advanced", "Master", "Expert", "Pro", "Deep Dive", "احتراف", "متقدم"],
    intermediate: ["Intermediate", "Build", "متوسط", "تطبيق"]
};

async function updateCourses() {
    console.log("Fetching courses...");
    const allCourses = await db.select().from(courses);

    for (const course of allCourses) {
        let updateData: any = {};
        const title = course.title || "";

        // 1. Determine Level
        let newLevel = "intermediate"; // Default

        // Check explicit level keywords
        if (levelKeywords.beginner.some(k => title.toLowerCase().includes(k.toLowerCase()))) newLevel = "beginner";
        else if (levelKeywords.advanced.some(k => title.toLowerCase().includes(k.toLowerCase()))) newLevel = "advanced";
        else if (levelKeywords.intermediate.some(k => title.toLowerCase().includes(k.toLowerCase()))) newLevel = "intermediate";

        updateData.level = newLevel;

        // 2. Determine Image
        let newImage = course.thumbnail; // Keep existing if no match

        for (const map of mappings) {
            if (map.keywords.some(k => title.toLowerCase().includes(k.toLowerCase()))) {
                newImage = map.image;
                if (map.level) updateData.level = map.level; // Override level if specific to topic (e.g. HTML is usually beginner)
                break;
            }
        }

        // Only update image if it was missing or we found a better one (forcing update)
        if (newImage) {
            updateData.thumbnail = newImage;
        }

        // Perform Update
        console.log(`Updating [${title}]: Level -> ${updateData.level}, Thumbnail -> ${updateData.thumbnail?.substring(0, 30)}...`);

        await db.update(courses)
            .set(updateData)
            .where(eq(courses.id, course.id));
    }

    console.log("All courses updated.");
    process.exit(0);
}

updateCourses();
