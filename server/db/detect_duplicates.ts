import { db } from "./index";
import { courses } from "./schema";
import { sql } from "drizzle-orm";

async function detectDuplicates() {
    console.log("=== Detecting Duplicate Courses ===");

    // Find courses with the same title
    const duplicates = await db.select({
        title: courses.title,
        count: sql<number>`count(*)`,
        ids: sql<string[]>`array_agg(id)`,
        slugs: sql<string[]>`array_agg(slug)`
    })
        .from(courses)
        .groupBy(courses.title)
        .having(sql`count(*) > 1`);

    console.log(`Found ${duplicates.length} duplicate titles:`);
    for (const d of duplicates) {
        console.log(`\nTitle: "${d.title}" (${d.count} instances)`);
        for (let i = 0; i < d.ids.length; i++) {
            console.log(`  - ID: ${d.ids[i]} | Slug: ${d.slugs[i]}`);
        }
    }
}

detectDuplicates().catch(console.error);
