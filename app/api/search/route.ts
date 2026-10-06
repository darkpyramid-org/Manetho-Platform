import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/responses";
import { globalSearch, hieroglyphRepository } from "@/lib/data";

/**
 * GET /api/search (spec §36).
 * GET /api/search?q=…&type=sign|artifact|museum|lesson|tour
 */
export const runtime = "nodejs";

const QuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(["all", "sign", "artifact", "museum", "lesson", "tour"]).default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const KIND_MAP = {
  sign: "hieroglyph",
  artifact: "artifact",
  museum: "museum",
  lesson: "lesson",
  tour: "tour",
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    type: url.searchParams.get("type") ?? "all",
    limit: url.searchParams.get("limit") ?? 20,
  });

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
      422,
    );
  }

  const { q, type, limit } = parsed.data;

  if (type === "sign") {
    const signs = hieroglyphRepository.search(q).slice(0, limit);
    return apiOk(
      signs.map((sign) => ({
        refId: sign.gardinerCode,
        title: `${sign.gardinerCode} — ${sign.name}`,
        subtitle: sign.signType,
        glyph: sign.glyph,
        phoneticValues: sign.phoneticValues,
        ideographicMeaning: sign.ideographicMeaning,
        unicode: sign.unicode,
      })),
      { meta: { total: signs.length, kind: "sign" } },
    );
  }

  const wanted = type === "all" ? null : KIND_MAP[type];
  const results = globalSearch(q, limit * 2).filter(
    (result) => wanted === null || result.kind === wanted,
  );

  return apiOk(results.slice(0, limit), {
    meta: { total: results.length, kind: type },
  });
}