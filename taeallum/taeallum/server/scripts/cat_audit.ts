import { db } from "../db/index";
import { courses, categories } from "../db/schema";
import { sql, eq } from "drizzle-orm";

async function main() {
    console.log("=== Category Audit ===");
    const cats = await db.select().from(categories);
    console.log(`Found ${cats.length} categories.`);

    for (const cat of cats) {
        const [stats] = await db.select({
            count: sql<number>`CAST(COUNT(*) AS INTEGER)`
        }).from(courses).where(eq(courses.categoryId, cat.id));

        console.log(`- [${cat.id}] ${cat.name} (${cat.slug}): ${stats.count} courses`);
    }
}

main().catch(console.error);
