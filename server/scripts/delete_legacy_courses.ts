import { db } from "../db/index";
import { courses, lessons, sections } from "../db/schema";
import { notInArray, count } from "drizzle-orm";

const ROADMAP_SLUGS = [
    // Core IT
    "01_Intro_to_Programming", "02_Structured_Programming", "03_OOP", "04_Data_Structures",
    "06_Linear_Algebra", "07_Probability_and_Statistics", "11_Databases", "10_Operating_Systems", "12_Networking",
    // AI
    "01_Machine_Learning", "02_Deep_Learning", "03_NLP", "04_Computer_Vision", "05_Object_Detection",
    // Cyber
    "01_InfoSec", "03_Ethical_Hacking", "04_Network_Security", "05_Cryptography", "06_Digital_Forensics",
    // Software Dev
    "01_Frontend", "02_React_TS", "03_MERN_Stack", "04_Flutter_Mobile", "05_Mobile_UIUX",
    // Data Science
    "01_PowerBI", "02_Data_Analysis", "15_Agentic_AI", "03_Big_Data", "04_NoSQL",
    // Network & Cloud
    "01_AWS", "02_Azure", "03_Cloud_Security",
    // Game Dev
    "01_Godot", "02_Blender",
    // IT Management
    "01_PMP", "02_Agile"
];

async function main() {
    console.log("=== Starting Legacy Course Deletion ===");

    // 1. Identify courses to delete
    const toDelete = await db.select({ id: courses.id, title: courses.title })
        .from(courses)
        .where(notInArray(courses.slug, ROADMAP_SLUGS));

    console.log(`Found ${toDelete.length} legacy courses to delete.`);
    toDelete.forEach(c => console.log(` - ${c.title}`));

    if (toDelete.length === 0) {
        console.log("No legacy courses found. Platform is already clean.");
        return;
    }

    // 2. Perform deletion
    // Cascade is enabled in DB schema, so deleting courses will delete sections and lessons.
    const deleted = await db.delete(courses).where(notInArray(courses.slug, ROADMAP_SLUGS));

    console.log(`Successfully deleted ${deleted.count ?? toDelete.length} legacy courses.`);

    // 3. Final Count
    const remaining = await db.select({ val: count() }).from(courses);
    console.log(`Final Roadmap Course Count: ${remaining[0].val}`);
}

main().catch(console.error);
