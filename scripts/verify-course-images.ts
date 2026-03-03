
import { db } from "../server/db";
import { courses } from "../server/db/schema";
import { isNull, or, eq } from "drizzle-orm";

async function verifyImages() {
    console.log("Verifying course images...");
    const missingImages = await db.select().from(courses).where(or(isNull(courses.thumbnail), eq(courses.thumbnail, "")));

    if (missingImages.length > 0) {
        console.log(`Found ${missingImages.length} courses without images:`);
        missingImages.forEach(c => console.log(`- ${c.title}`));
    } else {
        console.log("All courses have images! ✅");
    }
    process.exit(0);
}

verifyImages();
