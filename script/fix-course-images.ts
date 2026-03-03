
import { db } from "../server/db";
import { courses, categories } from "../server/db/schema";
import { eq } from "drizzle-orm";

const categoryImageMap: Record<string, string> = {
    "programming": "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80",
    "ai": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    "web-development": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
    "graphic-design": "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80",
    "digital-marketing": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    "cyber-security": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    "dropshipping": "https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?w=800&q=80",
    "qa-testing": "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=800&q=80",
    "language-learning": "https://images.unsplash.com/photo-1546410531-bb4caa1b424d?w=800&q=80",
    "other": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
};

async function fixCourseImages() {
    console.log("--- Fixing Course Images ---");

    const allCourses = await db.query.courses.findMany({
        with: { category: true }
    });

    for (const course of allCourses) {
        const categorySlug = course.category?.slug || "other";
        const newImage = categoryImageMap[categorySlug] || categoryImageMap["other"];

        console.log(`Updating "${course.title}" thumbnail to: ${newImage}`);

        await db.update(courses)
            .set({ thumbnail: newImage })
            .where(eq(courses.id, course.id));
    }

    console.log("\nImage fix complete.");
    process.exit(0);
}

fixCourseImages().catch(console.error);
