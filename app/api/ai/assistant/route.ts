import { z } from "zod";
import { streamAssistant } from "@/lib/ai/gateway";
import { publicErrorMessage } from "@/lib/api/responses";
import { artifactRepository, museumRepository, tourRepository } from "@/lib/data";
import { features } from "@/lib/features";
import type { SignDetection } from "@/types/hieroglyph";

/**
 * POST /api/ai/assistant (spec §43).
 *
 * Streams the assistant reply as Server-Sent Events so the
 * UI can render tokens as they arrive. Context (artifact,
 * translation result, tour stop) is resolved server-side
 * from ids, so the client never controls what the assistant
 * treats as fact.
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
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(20_000),
      }),
    )
    .max(20)
    .optional(),
  context: z
    .object({
      artifactId: z.string().max(100).optional(),
      museumId: z.string().max(100).optional(),
      tourId: z.string().max(100).optional(),
      translationResult: z
        .object({
          transliteration: z.string().max(2_000),
          translation: z.string().max(2_000),
          explanation: z.string().max(8_000),
          alternatives: z
            .array(
              z.object({
                transliteration: z.string().max(500),
                translation: z.string().max(500),
                confidence: z.number().min(0).max(1),
                explanation: z.string().max(2_000),
              }),
            )
            .max(10),
        })
        .optional(),
      detections: z
        .array(
          z.object({
            id: z.string(),
            boundingBox: z.object({
              x: z.number(),
              y: z.number(),
              width: z.number(),
              height: z.number(),
            }),
            gardinerCode: z.string(),
            unicode: z.string(),
            glyph: z.string(),
            name: z.string(),
            transliteration: z.string(),
            phoneticValues: z.array(z.string()),
            confidence: z.number(),
            confidenceLevel: z.enum(["high", "medium", "low"]),
            signType: z.string(),
            ideographicMeaning: z.string().optional(),
          }),
        )
        .max(120)
        .optional(),
    })
    .optional(),
  provider: z.enum(["mock", "openai", "huawei", "local"]).optional(),
});

function sse(
  controller: ReadableStreamDefaultController,
  event: string,
  data: unknown,
) {
  controller.enqueue(
    new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
  );
}

export async function POST(request: Request) {
  if (!features.aiAssistant) {
    return Response.json(
      {
        error: {
          code: "FEATURE_DISABLED",
          message: "The assistant is disabled in this deployment.",
        },
      },
      { status: 403 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "The request body is not valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const parsed = RequestSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues
            .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
            .join("; "),
        },
      },
      { status: 422 },
    );
  }

  const { message, mode, history, context, provider, locale } = parsed.data;

  // Resolve context from ids on the server. The client can
  // only name what it is looking at, not assert its contents.
  const artifact = context?.artifactId
    ? artifactRepository.get(context.artifactId)
    : undefined;
  const museum = context?.museumId
    ? museumRepository.get(context.museumId)
    : undefined;
  const tour = context?.tourId
    ? tourRepository.list().find((entry) => entry.id === context.tourId)
    : undefined;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamAssistant(
          {
            message,
            mode,
            language: locale,
            history: history?.filter((entry) => entry.role !== "system"),
            context: {
              artifact,
              museum,
              tour,
              translationResult: context?.translationResult,
              detections: context?.detections as SignDetection[] | undefined,
            },
          },
          (chunk) => {
            if (chunk.type === "delta" && chunk.delta) {
              sse(controller, "delta", { delta: chunk.delta });
            } else if (chunk.type === "done" && chunk.message) {
              sse(controller, "done", { message: chunk.message });
            } else if (chunk.type === "error" && chunk.error) {
              sse(controller, "error", chunk.error);
            }
          },
          provider,
        );
      } catch (exception) {
        console.error("[api/ai/assistant]", exception);
        sse(controller, "error", {
          code: "AI_PROVIDER_ERROR",
          message: publicErrorMessage(exception),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}