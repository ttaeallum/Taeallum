import { db } from './server/db';
import { courses } from './server/db/schema';

async function run() {
    try {
        const res = await db.select().from(courses);
        console.log('---START_COURSES---');
        console.log(JSON.stringify(res));
        console.log('---END_COURSES---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
