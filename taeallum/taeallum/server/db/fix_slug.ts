import { db } from "./index";
import { courses } from "./schema";
import { eq } from "drizzle-orm";

async function fix() {
    await db.update(courses)
        .set({ slug: '10_Operating_Systems' })
        .where(eq(courses.slug, '10_OS'));
    console.log('Fixed OS slug from 10_OS to 10_Operating_Systems');
}

fix().catch(console.error);
