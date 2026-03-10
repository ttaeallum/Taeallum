import { db } from "../db/index";
import { courses, categories } from "../db/schema";
import { eq, isNull } from "drizzle-orm";

const mapping: Record<string, string> = {
    // Core IT -> "الأساسيات التقنية" (or similar)
    "01_Intro_to_Programming": "programming",
    "02_Structured_Programming": "programming",
    "03_OOP": "software-engineering",
    "04_Data_Structures": "software-engineering",
    "06_Linear_Algebra": "data-ai",
    "07_Probability_and_Statistics": "data-ai",
    "11_Databases": "data-analytics-bi",
    "10_Operating_Systems": "devops-infrastructure",
    "12_Networking": "devops-infrastructure",

    // AI
    "01_Machine_Learning": "data-ai",
    "02_Deep_Learning": "data-ai",
    "03_NLP": "data-ai",
    "04_Computer_Vision": "data-ai",
    "05_Object_Detection": "data-ai",

    // Cybersecurity
    "01_InfoSec": "cybersecurity",
    "03_Ethical_Hacking": "cybersecurity",
    "04_Network_Security": "cybersecurity",
    "05_Cryptography": "cybersecurity",
    "06_Digital_Forensics": "cybersecurity",

    // Software Dev
    "01_Frontend": "web-development",
    "02_React_TS": "web-development",
    "03_MERN_Stack": "web-development",
    "04_Flutter_Mobile": "mobile-development",
    "05_Mobile_UIUX": "ui-ux-design",

    // Data Science
    "01_PowerBI": "data-analytics-bi",
    "02_Data_Analysis": "data-analytics-bi",
    "03_Big_Data": "data-analytics-bi",
    "04_NoSQL": "data-analytics-bi",

    // Cloud
    "01_AWS": "cloud-computing",
    "02_Azure": "cloud-computing",
    "03_Cloud_Security": "cybersecurity",

    // Game Dev
    "01_Godot": "game-development",
    "02_Blender": "game-development",

    // IT Management
    "01_PMP": "project-management",
    "02_Agile": "project-management"
};

async function main() {
    console.log("=== Syncing Courses to Categories ===");
    const cats = await db.select().from(categories);

    for (const [courseSlug, catSlug] of Object.entries(mapping)) {
        const cat = cats.find(c => c.slug === catSlug);
        if (cat) {
            await db.update(courses)
                .set({ categoryId: cat.id })
                .where(eq(courses.slug, courseSlug));
            console.log(`Linked ${courseSlug} to ${catSlug}`);
        } else {
            console.warn(`Category not found: ${catSlug}`);
        }
    }
    console.log("Sync complete!");
}

main().catch(console.error);
