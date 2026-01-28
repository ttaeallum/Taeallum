import "dotenv/config";
import type { Config } from "drizzle-kit";

const rawDbUrl = process.env.DATABASE || process.env.DATABASE_URL;
const cleanDbUrl = rawDbUrl?.replace(/^['"]|['"]$/g, "");

export default {
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: cleanDbUrl!,
  },
} satisfies Config;
