import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { createServer as createViteServer, createLogger } from "vite";
import type { Express } from "express";
import type { Server } from "http";
import viteConfig from "../vite.config";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // Don't exit on error, just log it
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  return vite;
}

export function serveViteSPA(vite: any, app: Express) {
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    const clientTemplate = path.resolve(
      import.meta.dirname,
      "..",
      "client",
      "index.html",
    );

    try {
      if (req.path.startsWith("/api") || req.path.includes(".")) {
        return next();
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
