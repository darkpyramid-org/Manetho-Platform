import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/responses";
import { hieroglyphRepository } from "@/lib/data";
import {
  hieroglyphCategoryLabels,
  type HieroglyphCategory,
} from "@/types/hieroglyph";

/**
 * GET /api/signs (spec §43).
 *
 * The sign database, filterable by category, sign type,
 * phonetic value or free text.
 * GET /api/signs?category=G&type=uniliteral&q=owl&limit=50
 */
export const runtime = "nodejs";

const QuerySchema = z.object({
  category: z
    .string()
    .max(4)
    .optional()
    .transform((value) => (value ? (value as HieroglyphCategory) : undefined)),
  type: z
    .enum([
      "uniliteral",
      "biliteral",
      "triliteral",
      "ideogram",
      "determinative",
      "classifier",
      "other",
    ])
    .optional(),
  q: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    category: url.searchParams.get("category") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    limit: url.searchParams.get("limit") ?? 100,
    offset: url.searchParams.get("offset") ?? 0,
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

  const { category, type, q, limit, offset } = parsed.data;

  let signs = hieroglyphRepository.list();
  if (category) {
    signs = signs.filter((sign) => sign.category === category);
  }
  if (type) {
    signs = signs.filter((sign) => sign.signType === type);
  }
  if (q) {
    const needle = q.trim().toLowerCase();
    signs = signs.filter(
      (sign) =>
        sign.name.toLowerCase().includes(needle) ||
        sign.gardinerCode.toLowerCase().includes(needle) ||
        sign.description.toLowerCase().includes(needle) ||
        (sign.ideographicMeaning ?? "").toLowerCase().includes(needle) ||
        sign.phoneticValues.some((value) =>
          value.toLowerCase().includes(needle),
        ),
    );
  }

  const page = signs.slice(offset, offset + limit);

  return apiOk(
    page.map((sign) => ({
      id: sign.id,
      gardinerCode: sign.gardinerCode,
      unicode: sign.unicode,
      glyph: sign.glyph,
      name: sign.name,
      description: sign.description,
      category: sign.category,
      categoryLabel: hieroglyphCategoryLabels[sign.category],
      signType: sign.signType,
      phoneticValues: sign.phoneticValues,
      mdc: sign.mdc,
      ideographicMeaning: sign.ideographicMeaning,
      determinativeMeaning: sign.determinativeMeaning,
      era: sign.era,
      sources: sign.sources.map((source) => source.citationText),
    })),
    {
      meta: {
        total: signs.length,
        limit,
        offset,
        hasMore: offset + limit < signs.length,
      },
    },
  );
}