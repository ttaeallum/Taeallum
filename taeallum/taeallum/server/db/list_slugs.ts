import { db } from "./index";
import { courses } from "./schema";

async function listSlugs() {
    const res = await db.select().from(courses);
    console.log(JSON.stringify(res.map(c => ({ id: c.id, title: c.title, slug: c.slug })), null, 2));
    process.exit(0);
}

listSlugs().catch(console.error);
