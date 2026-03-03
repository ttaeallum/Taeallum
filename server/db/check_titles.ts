import { db } from "./index";
import { lessons, courses, sections } from "./schema";
import { eq } from "drizzle-orm";

async function check() {
    console.log("=== Checking Machine Learning Lesson Titles ===");

    const [course] = await db.select().from(courses).where(eq(courses.slug, '01_Machine_Learning')).limit(1);
    if (!course) {
        console.log("Course not found for slug 01_Machine_Learning");
        return;
    }
    console.log(`Found Course: ${course.title} (ID: ${course.id})`);

    const [section] = await db.select().from(sections).where(eq(sections.courseId, course.id)).limit(1);
    if (!section) {
        console.log("Section not found for this course");
        return;
    }
    console.log(`Found Section: ${section.title} (ID: ${section.id})`);

    const samples = await db.select().from(lessons).where(eq(lessons.sectionId, section.id)).limit(10);
    console.log(`Found ${samples.length} sample lessons:`);
    samples.forEach(l => {
        console.log(`- Title: "${l.title}" | Linked ID: ${l.bunnyVideoId || 'NULL'}`);
    });
}

check().catch(console.error);
