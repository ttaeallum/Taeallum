import { db } from "../db/index";
import { categories, courses } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const cats = await db.select().from(categories);
    console.log("=== Finalized Learning Tracks ===");
    for (const cat of cats) {
        const crs = await db.select().from(courses).where(eq(courses.categoryId, cat.id));
        if (crs.length > 0) {
            console.log(`\n[Track] ${cat.name}:`);
            crs.forEach(c => console.log(` - ${c.title}`));
        }
    }
}

main().catch(console.error);
