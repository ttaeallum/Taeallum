import { db } from "../db/index";
import { lessons } from "../db/schema";
import { eq, and, isNull } from "drizzle-orm";

async function main() {
    const deleted = await db.delete(lessons).where(
        and(
            eq(lessons.title, "Play All Lessons"),
            isNull(lessons.bunnyVideoId)
        )
    );
    console.log(`Deleted placeholder lessons: ${deleted.count ?? 'Done'}`);
}

main().catch(console.error);
