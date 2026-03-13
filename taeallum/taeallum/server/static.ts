import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  console.log(`[STATION] Serving from: ${distPath}`);

  // 1. Serve static files normally
  app.use(express.static(distPath, { index: false }));

  // 2. Specialized handler for index.html to ensure it works as SPA
  app.get("*", (req, res, next) => {
    // Skip if it's an API or has a file extension (those should be handled by static or 404)
    if (req.path.startsWith("/api") || req.path.includes(".")) {
      return next();
    }

    const indexPath = path.resolve(distPath, "index.html");

    if (fs.existsSync(indexPath)) {
      // Return the index file for any client-side route
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Front-end build missing. Please check logs.");
    }
  });
}
