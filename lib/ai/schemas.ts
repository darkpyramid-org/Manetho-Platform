import { z } from "zod";

/**
 * Zod schemas for all AI output (spec §22, §70).
 *
 * Every provider result is validated before it
 * reaches the application. Model-generated JSON
 * is never trusted without validation.
 */

export const BoundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export const SignDetectionSchema = z.object({
  id: z.string().min(1),
  boundingBox: BoundingBoxSchema,
  gardinerCode: z.string().min(1),
  unicode: z.string().regex(/^U\+[0-9A-F]{4,6}$/i),
  glyph: z.string().min(1),
  name: z.string().min(1),
  transliteration: z.string().min(1),
  phoneticValues: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  confidenceLevel: z.enum(["high", "medium", "low"]),
  signType: z.enum([
    "uniliteral",
    "biliteral",
    "triliteral",
    "ideogram",
    "determinative",
    "classifier",
    "other",
  ]),
  ideographicMeaning: z.string().optional(),
});

export const AlternativeReadingSchema = z.object({
  transliteration: z.string().min(1),
  translation: z.string().min(1),
  confidence: z.number().min(0).max(1),
  confidenceLevel: z.enum(["high", "medium", "low"]),
  explanation: z.string().min(1),
});

export const TranslationResultSchema = z.object({
  requestId: z.string().min(1),
  imageId: z.string().min(1),
  status: z.enum(["completed", "failed", "low_confidence"]),
  detections: z.array(SignDetectionSchema),
  transliteration: z.string().min(1),
  translation: z.string().min(1),
  alternatives: z.array(AlternativeReadingSchema),
  explanation: z.string().min(1),
  context: z.object({
    historicalPeriod: z.string().optional(),
    possibleMeaning: z.string().optional(),
    grammar: z.string().optional(),
    culturalSignificance: z.string().optional(),
    references: z.string().optional(),
  }),
  overallConfidence: z.number().min(0).max(1),
  overallConfidenceLevel: z.enum(["high", "medium", "low"]),
  sources: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      author: z.string().optional(),
      publisher: z.string().optional(),
      url: z.string().optional(),
      publicationDate: z.string().optional(),
      type: z.enum([
        "BOOK",
        "PAPER",
        "MUSEUM",
        "DATABASE",
        "WEBSITE",
        "CATALOG",
        "ARCHIVE",
      ]),
      citationText: z.string().min(1),
    }),
  ),
  isDemo: z.boolean(),
  createdAt: z.string().datetime(),
});

export const CitationSchema = z.object({
  sourceId: z.string().optional(),
  title: z.string().min(1),
  author: z.string().optional(),
  year: z.string().optional(),
  url: z.string().optional(),
  type: z.string().min(1),
});

export const AssistantMessageSchema = z.object({
  id: z.string().min(1),
  conversationId: z.string().optional(),
  role: z.literal("assistant"),
  content: z.string().min(1),
  format: z.enum(["markdown", "plain"]),
  citations: z.array(CitationSchema).optional(),
  artifactCards: z.array(z.string()).optional(),
  signCards: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  feedback: z.enum(["up", "down"]).optional(),
  createdAt: z.string().datetime(),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    requestId: z.string().optional(),
  }),
});

export type SignDetectionInput = z.infer<typeof SignDetectionSchema>;
export type TranslationResultInput = z.infer<
  typeof TranslationResultSchema
>;
export type AssistantMessageInput = z.infer<
  typeof AssistantMessageSchema
>;
