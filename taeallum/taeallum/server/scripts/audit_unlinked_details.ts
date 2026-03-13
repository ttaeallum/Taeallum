import { db } from "../db/index";
import { courses, lessons, sections } from "../db/schema";
import { isNull, count, eq } from "drizzle-orm";

async function main() {
    const results = await db.select({
        courseTitle: courses.title,
        unlinkedCount: count(lessons.id)
    })
        .from(courses)
        .innerJoin(sections, eq(sections.courseId, courses.id))
        .innerJoin(lessons, eq(lessons.sectionId, sections.id))
        .where(isNull(lessons.bunnyVideoId))
        .groupBy(courses.title);

    console.log("--- UNLINKED LESSONS BY COURSE ---");
    results.forEach(r => {
        if (r.unlinkedCount > 0) {
            console.log(`${r.courseTitle}: ${r.unlinkedCount}`);
        }
    });

    const totalUnlinked = results.reduce((acc, r) => acc + Number(r.unlinkedCount), 0);
    console.log(`--- TOTAL_UNLINKED: ${totalUnlinked} ---`);
}

main().catch(console.error);
