import path from "node:path";
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

/**
 * Load the same environment file Next.js uses.
 *
 * The Prisma CLI reads `.env`, but this project keeps secrets in
 * `.env.local` (which Next.js loads and git-ignores). Node's
 * built-in loadEnvFile avoids adding dotenv just for this, and
 * lets a single file configure both the app and the CLI.
 */
for (const file of [".env.local", ".env"]) {
  const full = path.join(process.cwd(), file);
  if (existsSync(full)) {
    process.loadEnvFile(full);
    break;
  }
}

/**
 * Prisma configuration.
 *
 * Replaces the deprecated `package.json#prisma` block. Keeps the
 * schema location and seed command in one place that Prisma
 * actually reads.
 *
 * Note on the datasource url: it is intentionally absent here.
 * Prisma reads DATABASE_URL from the environment at runtime, so
 * the connection string never lives in the repository.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx scripts/seed.ts",
  },
});