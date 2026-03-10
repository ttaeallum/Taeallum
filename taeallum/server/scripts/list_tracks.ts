import { db } from "../db/index";
import { categories, courses } from "../db/schema";
import { count, eq } from "drizzle-orm";

async function main() {
    const cats = await db.select().from(categories);
    console.log("=== Current Study Plans/Tracks ===");
    for (const cat of cats) {
        const result = await db.select({ val: count() }).from(courses).where(eq(courses.categoryId, cat.id));
        console.log(`- ${cat.name}: ${result[0].val} courses`);
    }
}

main().catch(console.error);
