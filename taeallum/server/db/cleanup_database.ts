import { db } from "./index";
import { courses } from "./schema";
import { eq } from "drizzle-orm";

async function cleanup() {
    console.log("=== Cleaning up Database ===");

    // Delete duplicate Machine Learning course
    const result = await db.delete(courses).where(eq(courses.id, '75b4f85d-6a42-496f-99a0-5ea68671672b'));
    console.log("Deleted duplicate Machine Learning course (machine-learning-l71h)");

    console.log("=== Cleanup Completed ===");
}

cleanup().catch(console.error);
