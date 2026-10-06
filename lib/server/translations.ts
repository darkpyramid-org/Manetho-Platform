import type { TranslationResult } from "@/types/hieroglyph";
import { prisma, isDatabaseConfigured } from "@/lib/server/prisma";

/**
 * Translation persistence (spec §19, §41).
 *
 * Every reading the visitor produces is stored, so results can be
 * reviewed later, compared between providers, and audited.
 *
 * Persistence is best-effort by design: a database outage must
 * not stop a visitor from reading an inscription. If the write
 * fails, the reading is still returned — the failure is logged,
 * not surfaced as an error about a result that was computed
 * successfully.
 *
 * Only the Zod-validated result is stored. Nothing reaches this
 * table that has not already passed schema validation.
 */

export interface PersistTranslationInput {
  result: TranslationResult;
  artifactId?: string;
  /** Object-storage key of the uploaded image, when persisted. */
  imageKey: string;
  provider: string;
  model?: string;
}

/**
 * The domain uses lowercase statuses; the Prisma enum uses
 * SCREAMING_SNAKE_CASE. Mapping is explicit rather than a
 * blanket toUpperCase() with a cast, so an unmapped status fails
 * the type check instead of reaching the database.
 */
function toPrismaStatus(status: TranslationResult["status"]) {
  switch (status) {
    case "completed":
      return "COMPLETED" as const;
    case "failed":
      return "FAILED" as const;
    case "low_confidence":
      return "LOW_CONFIDENCE" as const;
  }
}

/** Store a reading. Returns the row id, or null if unavailable. */
export async function persistTranslation(
  input: PersistTranslationInput,
): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;

  const { result } = input;

  try {
    const row = await prisma.translation.create({
      data: {
        requestId: result.requestId,
        imageKey: input.imageKey,
        artifactId: input.artifactId ?? null,
        status: toPrismaStatus(result.status),
        // The validated result is stored verbatim so a later
        // reviewer sees exactly what the visitor saw.
        result: result as unknown as object,
        overallConfidence: result.overallConfidence,
        provider: input.provider,
        model: input.model ?? null,
        isDemo: result.isDemo,
        detections: {
          create: result.detections.map((detection) => ({
            sign: { connect: { gardinerCode: detection.gardinerCode } },
            x: detection.boundingBox.x,
            y: detection.boundingBox.y,
            width: detection.boundingBox.width,
            height: detection.boundingBox.height,
            confidence: detection.confidence,
            confidenceLevel: detection.confidenceLevel,
            transliteration: detection.transliteration,
          })),
        },
        sources: {
          // TranslationSource has a composite primary key, so it
          // is created through the nested relation rather than
          // connected by a single id. translationId is filled in
          // by Prisma as the parent is created.
          create: result.sources.map((source) => ({
            source: { connect: { id: source.id } },
          })),
        },
      },
    });
    return row.id;
  } catch (error: unknown) {
    console.warn(
      "[manetho] translation persisted as failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/** Record visitor feedback on a reading. */
export async function persistFeedback(
  requestId: string,
  rating: number,
  comment?: string,
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    const translation = await prisma.translation.findUnique({
      where: { requestId },
      select: { id: true },
    });
    if (!translation) return false;
    await prisma.translationFeedback.create({
      data: {
        translationId: translation.id,
        rating,
        comment: comment ?? null,
      },
    });
    return true;
  } catch (error: unknown) {
    console.warn(
      "[manetho] feedback not persisted:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

export interface TranslationSummary {
  id: string;
  requestId: string;
  artifactId: string | null;
  status: string;
  transliteration: string;
  translation: string;
  overallConfidence: number | null;
  provider: string;
  isDemo: boolean;
  signCount: number;
  createdAt: string;
}

/**
 * The AI review queue (spec §48).
 * Returns readings awaiting a human decision, newest first.
 */
export async function listForReview(
  limit = 50,
): Promise<TranslationSummary[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const rows = await prisma.translation.findMany({
      where: { status: { in: ["COMPLETED", "LOW_CONFIDENCE"] } },
      include: { detections: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rows.map((row) => {
      const result = (row.result ?? {}) as Partial<TranslationResult>;
      return {
        id: row.id,
        requestId: row.requestId,
        artifactId: row.artifactId,
        status: row.status,
        transliteration: result.transliteration ?? "—",
        translation: result.translation ?? "—",
        overallConfidence: row.overallConfidence,
        provider: row.provider,
        isDemo: row.isDemo,
        signCount: row.detections.length,
        createdAt: row.createdAt.toISOString(),
      };
    });
  } catch (error: unknown) {
    console.warn(
      "[manetho] review queue unavailable:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/** Record a reviewer's decision on a reading. */
export async function recordReview(
  requestId: string,
  decision: "approved" | "rejected",
  reviewerId: string | null,
  reason?: string,
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    const translation = await prisma.translation.findUnique({
      where: { requestId },
      select: { id: true },
    });
    if (!translation) return false;
    await prisma.translation.update({
      where: { requestId },
      data: {
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        audit: {
          create: {
            actorId: reviewerId,
            action: `translation.${decision}`,
            entityType: "Translation",
            entityId: requestId,
            // translationId is set by the relation, not here.
            after: reason ? { reason } : undefined,
          },
        },
      },
    });
    return true;
  } catch (error: unknown) {
    console.warn(
      "[manetho] review not recorded:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/** Content counts for the admin dashboard. */
export async function contentCounts(): Promise<
  Record<string, number> | null
> {
  if (!isDatabaseConfigured()) return null;
  try {
    const [
      museums,
      artifacts,
      signs,
      courses,
      lessons,
      tours,
      translations,
      pendingReview,
    ] = await Promise.all([
      prisma.museum.count(),
      prisma.artifact.count(),
      prisma.hieroglyphSign.count(),
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.tour.count(),
      prisma.translation.count(),
      prisma.translation.count({ where: { reviewedAt: null } }),
    ]);
    return {
      museums,
      artifacts,
      signs,
      courses,
      lessons,
      tours,
      translations,
      pendingReview,
    };
  } catch (error: unknown) {
    console.warn(
      "[manetho] counts unavailable:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}