import { Router } from "express";
import { db } from "../db";
import { courses } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Sitemap.xml
router.get("/sitemap.xml", async (req, res) => {
    try {
        const baseUrl = "https://taallm.com";

        // Fetch dynamic content
        const allCourses = await db.query.courses.findMany({
            where: eq(courses.isPublished, true),
            orderBy: [desc(courses.createdAt)],
            columns: {
                slug: true,
                updatedAt: true,
            }
        });

        // Static pages
        const pages = [
            "",
            "/courses",
            "/auth",
            "/pricing",
            "/contact",
            "/about",
            "/terms",
            "/privacy"
        ];

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add static pages
        pages.forEach(page => {
            sitemap += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>`;
        });

        // Add dynamic courses
        allCourses.forEach(course => {
            sitemap += `
  <url>
    <loc>${baseUrl}/courses/${course.slug}</loc>
    <lastmod>${new Date(course.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
        });

        sitemap += `
</urlset>`;

        res.header("Content-Type", "application/xml");
        res.send(sitemap);
    } catch (error) {
        console.error("[SITEMAP ERROR]", error);
        res.status(500).end();
    }
});

// Robots.txt
router.get("/robots.txt", (req, res) => {
    const robots = `User-agent: *
Allow: /

Sitemap: https://taallm.com/sitemap.xml
`;
    res.header("Content-Type", "text/plain");
    res.send(robots);
});

export default router;
