import { db } from '../server/db/index';
import { courses } from '../server/db/schema';
import { like, or } from 'drizzle-orm';

const run = async () => {
    try {
        const results = await db.select().from(courses).where(
            or(
                like(courses.title, '%ذكاء%'),
                like(courses.description, '%ذكاء%'),
                like(courses.title, '%AI%'),
                like(courses.description, '%AI%')
            )
        );
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
