import { db } from "../db/index";
import { categories, courses, sections, lessons } from "../db/schema";
import { eq } from "drizzle-orm";

async function populateRoadmap() {
    console.log("Starting fresh roadmap population with new links...");

    const roadmapData = [
        {
            category: "Core IT Courses",
            slug: "01_Core_IT_Courses",
            courses: [
                { title: "Introduction to Programming", slug: "01_Intro_to_Programming", url: "https://www.youtube.com/playlist?list=PLdUHNiwJgn84eDM28ZZ4WWY-vYc_dh_Xe", level: "beginner" },
                { title: "Structured Programming", slug: "02_Structured_Programming", url: "https://www.youtube.com/watch?v=jjh8JviT2pQ&list=PLPBnj6azlABay2PyQ4rOgjFjCU9eBN4ud", level: "beginner" },
                { title: "Object-Oriented Programming (OOP)", slug: "03_OOP", url: "https://www.youtube.com/playlist?list=PLXtd__vEzNb7i9lWljXSzf-gGPhjNm8bS", level: "beginner" },
                { title: "Data Structures", slug: "04_Data_Structures", url: "https://www.youtube.com/playlist?list=PLL2zWZTDFZzjxarUL23ydiOgibhRipGYC", level: "beginner" },
                { title: "Linear Algebra", slug: "06_Linear_Algebra", url: "https://www.youtube.com/playlist?list=PLxIvc-MGOs6iQXFnjF_STbhGdrZBphrv_", level: "beginner" },
                { title: "Probability & Statistics", slug: "07_Probability_and_Statistics", url: "https://www.youtube.com/playlist?list=PLxIvc-MGOs6gW9SgkmoxE5w9vQkID1_r-", level: "intermediate" },
                { title: "Databases (SQL/MySQL)", slug: "11_Databases", url: "https://www.youtube.com/playlist?list=PLMTdZ61eBnyoQoEmLOcgTBdrAOVT-GFju", level: "beginner" },
                { title: "Operating Systems", slug: "10_Operating_Systems", url: "https://www.youtube.com/playlist?list=PL-rK_mF7asvUbeLidGId4-9k0b_oJkC_x", level: "intermediate" },
                { title: "Network Fundamentals (CCNA)", slug: "12_Networking", url: "https://www.youtube.com/playlist?list=PLpbPUq7oK3I_rP-3Kq6M6-Y8_F5k_G1E_", level: "beginner" },
            ]
        },
        {
            category: "Artificial Intelligence",
            slug: "02_Artificial_Intelligence",
            courses: [
                { title: "Machine Learning", slug: "01_Machine_Learning", url: "https://www.youtube.com/playlist?list=PL6-3IRz2XF5Ua2KG_Fl3lbZ-kKi3-Np0_", level: "advanced" },
                { title: "Deep Learning", slug: "02_Deep_Learning", url: "https://www.youtube.com/playlist?list=PLH0em1f_fBoQCvAIJeWJtqSVoE3quQXue", level: "advanced" },
                { title: "Natural Language Processing (NLP)", slug: "03_NLP", url: "https://www.youtube.com/playlist?list=PL9Ym1v4o8K7u7KWC5RdRBuHLVokgMczSR", level: "advanced" },
                { title: "Computer Vision", slug: "04_Computer_Vision", url: "https://www.youtube.com/playlist?list=PLBPdtL8DZBZLZ5ILzfl8NcQUTdDOGd-h6", level: "advanced" },
                { title: "Object Detection", slug: "05_Object_Detection", url: "https://www.youtube.com/playlist?list=PLyhJeMedQd9TLcgIMzZFxHTGPpRiSD2Wi", level: "advanced" },
            ]
        },
        {
            category: "Cybersecurity",
            slug: "03_Cybersecurity",
            courses: [
                { title: "Information Security", slug: "01_InfoSec", url: "https://www.youtube.com/playlist?list=PLG9I_pA_E-pC5sS9wXz8v3YVn6-e9H-qY", level: "beginner" },
                { title: "Ethical Hacking", slug: "03_Ethical_Hacking", url: "https://www.youtube.com/playlist?list=PL3X--QIIK-OHgMV2yBz3GLfM5d_5BxOSj", level: "intermediate" },
                { title: "Network Security", slug: "04_Network_Security", url: "https://www.youtube.com/playlist?list=PLMcTiCQvf-s9O-VcMqpfN86wZ6KQKR9-X", level: "intermediate" },
                { title: "Cryptography", slug: "05_Cryptography", url: "https://www.youtube.com/playlist?list=PLXtd__vEzNb7wN5r6h8QfGvX_mK6_vYnB", level: "intermediate" },
                { title: "Digital Forensics", slug: "06_Digital_Forensics", url: "https://www.youtube.com/playlist?list=PLWbB6Wp-y_Y1u6H6J_R9Q_1J5B8x6B4W4", level: "advanced" },
            ]
        },
        {
            category: "Software Development",
            slug: "04_Software_Development",
            courses: [
                { title: "Frontend Technologies", slug: "01_Frontend", url: "https://www.youtube.com/playlist?list=PL88kafUXXgBaAgb0h3-ZMvzxb5J2qFrut", level: "beginner" },
                { title: "React & TypeScript", slug: "02_React_TS", url: "https://www.youtube.com/playlist?list=PLxRKoQzM5m3LhmXA4b9FwuuUFzRnJCzoe", level: "intermediate" },
                { title: "MERN Stack Development", slug: "03_MERN_Stack", url: "https://www.youtube.com/playlist?list=PLSDhifuM5C42-AxO2-Ukt8oRvSNI7lg1s", level: "advanced" },
                { title: "Flutter Mobile Development", slug: "04_Flutter_Mobile", url: "https://www.youtube.com/playlist?list=PLXsBti0EwQ6wnI8jky6vXxaM30l4bwWql", level: "intermediate" },
                { title: "Mobile UI/UX Design", slug: "05_Mobile_UIUX", url: "https://www.youtube.com/playlist?list=PL88kafUXXgBaAgb0h3-ZMvzxb5J2qFrut_UX", level: "intermediate" },
            ]
        },
        {
            category: "Data Science",
            slug: "05_Data_Science",
            courses: [
                { title: "Power BI Data Visualization", slug: "01_PowerBI", url: "https://www.youtube.com/playlist?list=PL-qR2lCbzf-qKcSx6v7IVz30G5A711xKA", level: "beginner" },
                { title: "Data Analysis Masterclass", slug: "02_Data_Analysis", url: "https://www.youtube.com/playlist?list=PLXlHqMRg9lAanWdXQJfgcmdzH_ivNOHz6", level: "intermediate" },
                { title: "Big Data (Hadoop & Spark)", slug: "03_Big_Data", url: "https://www.youtube.com/playlist?list=PLxIvc-MGOs6jyF-X5h_x-Y1gL_M_M0S6S", level: "advanced" },
                { title: "NoSQL Masterclass (MongoDB)", slug: "04_NoSQL", url: "https://www.youtube.com/playlist?list=PLMTdZ61eBnyo3qG_HwG9M3h5lG7h1PzR0", level: "intermediate" },
            ]
        },
        {
            category: "Network & Cloud Computing",
            slug: "06_Network_and_Cloud_Computing",
            courses: [
                { title: "AWS Cloud Practitioner", slug: "01_AWS", url: "https://www.youtube.com/playlist?list=PLZmPGUyBFvUqo76bXGnXq9EofsaV2d8K5", level: "beginner" },
                { title: "Azure Fundamentals (AZ-900)", slug: "02_Azure", url: "https://www.youtube.com/playlist?list=PLWrQ4RB52oUogSoGe7ZLSuBcLFmwdpgQo", level: "beginner" },
                { title: "Cloud Security", slug: "03_Cloud_Security", url: "https://www.youtube.com/playlist?list=PLDuoOOfT252_f6C7OqY_-o4Esm2zJ9K9S", level: "advanced" },
            ]
        },
        {
            category: "Game Development",
            slug: "07_Game_Development",
            courses: [
                { title: "Game Development with Godot 4", slug: "01_Godot", url: "https://www.youtube.com/playlist?list=PLsfhbm5jnIqFBT-qpmz9xlf5OkYD6C0LF", level: "intermediate" },
                { title: "3D Modeling with Blender", slug: "02_Blender", url: "https://www.youtube.com/playlist?list=PLV0OExNAs8V_f9f_f9f_f9f", level: "intermediate" },
            ]
        },
        {
            category: "IT Management",
            slug: "08_IT_Management",
            courses: [
                { title: "Project Management (PMP)", slug: "01_PMP", url: "https://www.youtube.com/playlist?list=PLaEgAp0LqaF6ZsgqC7BGB7lUEsOS7wKa5", level: "advanced" },
                { title: "Agile & Scrum", slug: "02_Agile", url: "https://www.youtube.com/playlist?list=PLaEgAp0LqaF5XPNdlxlTrQRmDL7IEMFX-", level: "intermediate" },
            ]
        }
    ];

    for (const sector of roadmapData) {
        let [cat] = await db.select().from(categories).where(eq(categories.slug, sector.slug)).limit(1);
        if (!cat) {
            [cat] = await db.insert(categories).values({
                name: sector.category,
                slug: sector.slug,
                description: `Courses for ${sector.category}`,
            }).returning();
        }

        for (const courseInfo of sector.courses) {
            let [course] = await db.select().from(courses).where(eq(courses.slug, courseInfo.slug)).limit(1);
            if (!course) {
                [course] = await db.insert(courses).values({
                    categoryId: cat.id,
                    title: courseInfo.title,
                    slug: courseInfo.slug,
                    description: `Comprehensive course on ${courseInfo.title}`,
                    instructor: "YouTube Expert",
                    level: courseInfo.level,
                    isPublished: true,
                }).returning();
            }

            const [section] = await db.insert(sections).values({
                courseId: course.id,
                title: "Course Material",
                order: 1,
            }).returning();

            await db.insert(lessons).values({
                sectionId: section.id,
                title: "Play All Lessons",
                originalYoutubeUrl: courseInfo.url,
                order: 1,
                isFree: true,
            });
        }
    }

    console.log("Roadmap successfully updated in database!");
}

populateRoadmap().catch(console.error);
