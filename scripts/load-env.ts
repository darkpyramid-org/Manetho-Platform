import path from "node:path";
import { existsSync } from "node:fs";

/**
 * Load the project's environment file.
 *
 * Prisma's CLI goes through prisma.config.ts, which loads the
 * env. Scripts run directly with tsx do not, so they would
 * otherwise fail with "Environment variable not found:
 * DATABASE_URL" even though the app itself works.
 *
 * `.env.local` is checked first because that is what Next.js
 * loads and what .gitignore excludes. Node's built-in
 * loadEnvFile avoids adding dotenv as a dependency.
 */
export function loadEnv(): void {
  for (const file of [".env.local", ".env"]) {
    const full = path.join(process.cwd(), file);
    if (existsSync(full)) {
      process.loadEnvFile(full);
      return;
    }
  }
}