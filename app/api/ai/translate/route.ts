import { z } from "zod";
import { translateInscription } from "@/lib/ai/gateway";
import { apiError, apiErrorFromException, apiOk } from "@/lib/api/responses";
import { artifactRepository, museumRepository } from "@/lib/data";
import { features, aiProvider } from "@/lib/features";
import { persistTranslation } from "@/lib/server/translations";

/**
 * POST /api/ai/translate (spec §43).
 *
 * Runs the full inscription pipeline: vision → OCR →
 * translation, and returns a Zod-validated TranslationResult.
 * Never returns a fabricated reading: when confidence is
 * too low the result carries status "low_confidence" and no
 * translation text.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  image: z.object({
    dataUrl: z
      .string()
      .min(1)
      // 10 MB decoded is roughly 13.5 MB of base64.
      .max(14_000_000)
      .refine(
        (value) =>
          value.startsWith("data:image/") ||
          value.startsWith("data:application/octet-stream"),
        { message: "dataUrl must be an image data URL" },
      ),
    mimeType: z.string().optional(),
    filename: z.string().max(255).optional(),
    width: z.number().int().positive().max(20_000).optional(),
    height: z.number().int().positive().max(20_000).optional(),
  }),
  context: z
    .object({
      artifactId: z.string().max(100).optional(),
      museumId: z.string().max(100).optional(),
      historicalPeriod: z.string().max(120).optional(),
    })
    .optional(),
  provider: z.enum(["mock", "openai", "huawei", "local"]).optional(),
});

export async function POST(request: Request) {
  if (!features.translator) {
    return apiError(
      "FEATURE_DISABLED",
      "The translator is disabled in this deployment.",
      403,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "The request body is not valid JSON.", 400);
  }

  const parsed = RequestSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
        .join("; "),
      422,
    );
  }

  const { image, context, provider } = parsed.data;

  try {
    const artifact = context?.artifactId
      ? artifactRepository.get(context.artifactId)
      : undefined;
    const museum = context?.museumId
      ? museumRepository.get(context.museumId)
      : undefined;

    const result = await translateInscription(
      image,
      {
        artifact,
        museum,
        historicalPeriod: context?.historicalPeriod,
      },
      provider,
    );

    // Store the validated reading so it can be reviewed and
    // audited later. This is best-effort: a database outage
    // must not deny the visitor a reading they already earned.
    const storedId = await persistTranslation({
      result,
      artifactId: artifact?.id,
      imageKey: "upload",
      provider: provider ?? aiProvider(),
    });

    return apiOk(result, {
      meta: {
        provider: provider ?? aiProvider(),
        detections: result.detections.length,
        status: result.status,
        persisted: Boolean(storedId),
      },
    });
  } catch (exception) {
    console.error("[api/ai/translate]", exception);
    return apiErrorFromException(exception);
  }
}