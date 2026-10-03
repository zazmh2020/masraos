import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";
// Match the local preview without overwriting explicit deployment environment variables.
loadEnv({ path: '.env.local', quiet: true });
loadEnv({ quiet: true });
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] },
});
