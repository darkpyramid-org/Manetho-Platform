import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton (spec §41).
 *
 * Next.js hot-reloads modules in development, which would open a
 * new connection pool on every save and exhaust the database's
 * connection limit. Caching the client on globalThis keeps one
 * pool per process.
 *
 * This module is server-only. Never import it from a client
 * component: it would bundle the database credentials.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** True when a database is configured and reachable. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Verify the database connection.
 * Returns a status object rather than throwing, so the health
 * endpoint can report connectivity without failing the request.
 */
export async function checkDatabase(): Promise<{
  configured: boolean;
  reachable: boolean;
  latencyMs?: number;
  error?: string;
}> {
  if (!isDatabaseConfigured()) {
    return { configured: false, reachable: false };
  }
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      configured: true,
      reachable: true,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error: unknown) {
    return {
      configured: true,
      reachable: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}