
import "dotenv/config";
import { db } from "../server/db";
import { lessons } from "../server/db/schema";

async function getSamples() {
    const data = await db.select({ id: lessons.id, title: lessons.title, videoUrl: lessons.videoUrl }).from(lessons).limit(1);
    console.log(JSON.stringify(data, null, 2));
}

getSamples().catch(console.error).finally(() => process.exit());
