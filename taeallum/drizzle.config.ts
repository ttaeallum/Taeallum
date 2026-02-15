import "dotenv/config";
import type { Config } from "drizzle-kit";

const rawDbUrl = process.env.DATABASE || process.env.DATABASE_URL;
const cleanDbUrl = (rawDbUrl && rawDbUrl.trim().length > 10)
  ? rawDbUrl.replace(/^['"]|['"]$/g, "").trim()
  : "postgresql://postgres:postgres@localhost:5432/postgres"; // Dummy for build time

export default {
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: cleanDbUrl,
  },
} satisfies Config;
