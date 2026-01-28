import { db } from "./index";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

async function seed() {
    console.log("🌱 Seeding database...");

    try {
        // 1. Clear existing data (optional, but good for a fresh start)
        // await db.delete(schema.adminAuditLogs);
        // await db.delete(schema.orders);
        // await db.delete(schema.enrollments);
        // await db.delete(schema.lessons);
        // await db.delete(schema.sections);
        // await db.delete(schema.courses);
        // await db.delete(schema.categories);

        // 2. Add Category
        const [category] = await db.insert(schema.categories).values({
            name: "برمجة الويب",
            slug: "web-development",
            description: "تعلم بناء مواقع وتطبيقات الويب باستخدام أحدث التقنيات",
        }).returning();
        console.log("✅ Category added:", category.name);

        // 3. Add Course
        const [course] = await db.insert(schema.courses).values({
            categoryId: category.id,
            title: "دورة Full-Stack React & Node.js",
            slug: "fullstack-react-nodejs",
            description: "دورة شاملة تأخذك من الصفر لاحتراف بناء تطبيقات ويب كاملة",
            instructor: "أحمد المبرمج",
            level: "beginner",
            price: "199.00",
            isPublished: true,
            thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
        }).returning();
        console.log("✅ Course added:", course.title);

        // 4. Add Section
        const [section] = await db.insert(schema.sections).values({
            courseId: course.id,
            title: "المقدمة وأساسيات React",
            order: 1,
        }).returning();
        console.log("✅ Section added:", section.title);

        // 5. Add Lesson
        const [lesson] = await db.insert(schema.lessons).values({
            sectionId: section.id,
            title: "ما هو React ولماذا نستخدمه؟",
            content: "في هذا الدرس سنتعرف على أساسيات مكتبة React ومميزاتها...",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Just a placeholder
            order: 1,
            isFree: true,
            duration: 15,
        }).returning();
        console.log("✅ Lesson added:", lesson.title);

        console.log("🚀 Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seed();
