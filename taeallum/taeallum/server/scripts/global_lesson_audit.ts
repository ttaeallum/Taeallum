import { db } from "../db/index";
import { lessons } from "../db/schema";
import { count, isNull, isNotNull } from "drizzle-orm";

async function main() {
    // 1. Total lessons defined in the entire system
    const totalResult = await db.select({ val: count() }).from(lessons);
    const totalCount = totalResult[0].val;

    // 2. Lessons with Bunny IDs
    const linkedResult = await db.select({ val: count() }).from(lessons).where(isNotNull(lessons.bunnyVideoId));
    const linkedCount = linkedResult[0].val;

    // 3. Lessons without Bunny IDs
    const unlinkedResult = await db.select({ val: count() }).from(lessons).where(isNull(lessons.bunnyVideoId));
    const unlinkedCount = unlinkedResult[0].val;

    console.log(`--- GLOBAL_TOTAL_LESSONS: ${totalCount} ---`);
    console.log(`--- GLOBAL_LINKED_LESSONS: ${linkedCount} ---`);
    console.log(`--- GLOBAL_UNLINKED_LESSONS: ${unlinkedCount} ---`);
}

main().catch(console.error);
