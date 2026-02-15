import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

export default defineConfig(async ({ mode }) => {
  const plugins = [
    react(),
    tailwindcss(),
    metaImagesPlugin(),
  ];

  if (mode !== "production") {
    try {
      const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal").then(m => m.default);
      plugins.push(runtimeErrorOverlay());

      if (process.env.REPL_ID !== undefined) {
        const { cartographer } = await import("@replit/vite-plugin-cartographer");
        const { devBanner } = await import("@replit/vite-plugin-dev-banner");
        plugins.push(cartographer(), devBanner());
      }
    } catch (e) {
      console.warn("Development plugins failed to load:", e);
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "client", "src"),
        "@shared": path.resolve(process.cwd(), "shared"),
        "@assets": path.resolve(process.cwd(), "attached_assets"),
      },
    },
    css: {
      postcss: {
        plugins: [],
      },
    },
    root: path.resolve(process.cwd(), "client"),
    build: {
      outDir: path.resolve(process.cwd(), "dist", "public"),
      emptyOutDir: true,
      sourcemap: true, // Helpful for debugging blank page
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: false,
        allow: [".."],
      },
    },
  };
});
