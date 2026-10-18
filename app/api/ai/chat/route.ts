import { z } from "zod";
import { completeAssistant } from "@/lib/ai/gateway";
import { apiError, apiErrorFromException, apiOk } from "@/lib/api/responses";
import { artifactRepository, museumRepository } from "@/lib/data";
import { features } from "@/lib/features";
import {
  enforceAiRateLimit,
  resolveAiProvider,
  assertAiProviderConfigured,
} from "@/lib/api/ai-guards";
import type { SignDetection } from "@/types/hieroglyph";

/**
 * POST /api/ai/chat (spec §43).
 *
 * Non-streaming assistant completion. Used by clients that
 * cannot consume SSE (native apps, simple integrations) and
 * as the fallback when the stream is unavailable.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  message: z.string().min(1).max(8_000),
  mode: z.enum(["visitor", "educational", "research", "guide"]),
  locale: z.string().max(10).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(20_000),
      }),
    )
    .max(20)
    .optional(),
  context: z
    .object({
      artifactId: z.string().max(100).optional(),
      museumId: z.string().max(100).optional(),
      detections: z.array(z.record(z.string(), z.unknown())).max(120).optional(),
      translationResult: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  provider: z.enum(["mock", "openai", "huawei", "local"]).optional(),
});

export async function POST(request: Request) {
  const limited = enforceAiRateLimit(request);
  if (limited) return limited;

  if (!features.aiAssistant) {
    return apiError(
      "FEATURE_DISABLED",
      "The assistant is disabled in this deployment.",
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

  const { message, mode, history, context, provider: clientProvider, locale } = parsed.data;
  const provider = resolveAiProvider(clientProvider);
  const misconfigured = assertAiProviderConfigured(provider);
  if (misconfigured) return misconfigured;

  try {
    const artifact = context?.artifactId
      ? artifactRepository.get(context.artifactId)
      : undefined;
    const museum = context?.museumId
      ? museumRepository.get(context.museumId)
      : undefined;

    const result = await completeAssistant(
      {
        message,
        mode,
        language: locale,
        history,
        context: {
          artifact,
          museum,
          detections: context?.detections as SignDetection[] | undefined,
          translationResult: context?.translationResult,
        },
      },
      provider,
    );

    return apiOk(result);
  } catch (exception) {
    console.error("[api/ai/chat]", exception);
    return apiErrorFromException(exception);
  }
}
