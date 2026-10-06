import { apiOk } from "@/lib/api/responses";
import { aiProvider, features, isDemoMode } from "@/lib/features";
import {
  artifacts,
  courses,
  museums,
  hieroglyphSigns,
  tours,
} from "@/lib/data";
import { checkDatabase, isDatabaseConfigured } from "@/lib/server/prisma";
import { contentCounts } from "@/lib/server/translations";

/**
 * GET /api/health (spec §43).
 *
 * Liveness plus a summary of the deployment configuration.
 * Exposes whether the platform is running in demo mode so
 * integrations can detect it — the demo flag is part of the
 * product contract, not a secret (spec §86).
 *
 * Database status is reported without failing the request: a
 * database outage should be visible in monitoring, not turn
 * health checks red for the whole service when content is being
 * served from the in-memory dataset.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabase();
  const storedCounts = await contentCounts();

  const lessonCount = courses.reduce(
    (total, course) => total + course.lessons.length,
    0,
  );

  // When a database is configured, the stored figures are
  // authoritative; otherwise report the in-memory dataset.
  const content = storedCounts
    ? {
        source: "postgresql" as const,
        museums: storedCounts.museums,
        artifacts: storedCounts.artifacts,
        signs: storedCounts.signs,
        courses: storedCounts.courses,
        lessons: storedCounts.lessons,
        tours: storedCounts.tours,
        translations: storedCounts.translations,
        pendingReview: storedCounts.pendingReview,
      }
    : {
        source: "in-memory" as const,
        museums: museums.length,
        artifacts: artifacts.length,
        signs: hieroglyphSigns.length,
        courses: courses.length,
        lessons: lessonCount,
        tours: tours.length,
        translations: 0,
        pendingReview: 0,
      };

  return apiOk(
    {
      status: "ok",
      version: process.env.npm_package_version ?? "0.1.0",
      provider: aiProvider(),
      demoMode: isDemoMode(),
      features,
      database: {
        configured: isDatabaseConfigured(),
        reachable: database.reachable,
        latencyMs: database.latencyMs,
        ...(database.error ? { error: database.error } : {}),
      },
      content,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}