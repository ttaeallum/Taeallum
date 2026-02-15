import { db } from './server/db/index';
import { categories } from './server/db/schema';
import { eq } from 'drizzle-orm';

async function addCategory() {
    console.log("Adding missing categories...");

    const categorySlug = "language-learning";
    const categoryName = "تعلم اللغات"; // Arabic for Language Learning

    const existing = await db.select().from(categories).where(eq(categories.slug, categorySlug));

    if (existing.length === 0) {
        await db.insert(categories).values({
            name: categoryName,
            slug: categorySlug,
            icon: "Languages", // Assuming this icon exists or using a default
            description: "دورات لتعلم اللغات المختلفة",
            order: 10
        });
        console.log(`Category '${categorySlug}' added successfully.`);
    } else {
        console.log(`Category '${categorySlug}' already exists.`);
    }

    process.exit(0);
}

addCategory();
