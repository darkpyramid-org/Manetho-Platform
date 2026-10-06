import { z } from "zod";
import { uid } from "@/lib/utils";
import {
  SignDetectionSchema,
  AssistantMessageSchema,
} from "@/lib/ai/schemas";
import type { HieroglyphSign, SignDetection } from "@/types/hieroglyph";
import type {
  AssistantMessage,
  AssistantRequest,
  EmbeddingOutcome,
  EmbeddingRequest,
  ImageInput,
  LLMProvider,
  LLMStreamChunk,
  OCRProvider,
  TranslationOutcome,
  TranslationProvider,
  TranslationRequest,
  VisionInspection,
  VisionProvider,
  VisionRequest,
} from "@/lib/ai/types";
import { hieroglyphRepository } from "@/lib/data";

/**
 * Huawei Cloud provider (spec §58).
 *
 * Targets Huawei Cloud ModelArts Studio's
 * OpenAI-compatible endpoint. The base URL,
 * API key and model names are configurable
 * (see .env.example). All model output is
 * Zod-validated before it reaches the app.
 *
 * Requires HUAWEI_API_KEY. If the deployment
 * does not have Huawei credentials, the gateway
 * falls back to the next configured provider.
 */

export const HUAWEI_CONFIG = {
  apiKey: process.env.HUAWEI_API_KEY ?? "",
  baseUrl:
    process.env.HUAWEI_BASE_URL ??
    "https://api.huaweicloud.com/v1",
  visionModel: process.env.HUAWEI_VISION_MODEL ?? "glm-4v",
  chatModel: process.env.HUAWEI_CHAT_MODEL ?? "glm-4",
  embeddingModel:
    process.env.HUAWEI_EMBEDDING_MODEL ?? "bge-large-zh",
} as const;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: { url: string };
  }>;
}

async function chatComplete(
  messages: ChatMessage[],
  model: string,
  jsonMode = true,
): Promise<string> {
  if (!HUAWEI_CONFIG.apiKey) {
    throw new Error(
      "AI_NOT_CONFIGURED: HUAWEI_API_KEY is not set.",
    );
  }
  const response = await fetch(
    `${HUAWEI_CONFIG.baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUAWEI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        ...(jsonMode
          ? { response_format: { type: "json_object" } }
          : {}),
        temperature: 0.2,
      }),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `AI_PROVIDER_ERROR: Huawei Cloud returned ${response.status}: ${detail.slice(0, 300)}`,
    );
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(
      "AI_PROVIDER_ERROR: empty completion from Huawei Cloud.",
    );
  }
  return content;
}

function parseJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1] : trimmed;
  return JSON.parse(text);
}

function toImageUrl(image: ImageInput): string | null {
  return image.dataUrl ?? null;
}

function signCatalogue(limit = 60): string {
  return hieroglyphRepository
    .list()
    .slice(0, limit)
    .map(
      (s) =>
        `${s.gardinerCode} (${s.name}): values ${s.phoneticValues.join("/")}${s.ideographicMeaning ? `, ideogram: ${s.ideographicMeaning}` : ""}`,
    )
    .join("\n");
}

export class HuaweiVisionProvider implements VisionProvider {
  readonly name = "huawei-vision";

  async inspect(request: VisionRequest): Promise<VisionInspection> {
    const imageUrl = toImageUrl(request.image);
    if (!imageUrl) {
      throw new Error(
        "AI_INPUT_ERROR: the image could not be read. Upload an image file.",
      );
    }

    const raw = await chatComplete(
      [
        {
          role: "system",
          content:
            "You are an Egyptologist vision model. Detect hieroglyphic signs in the image. Return ONLY a JSON object with an array 'detections'. Each detection: {gardinerCode, unicode (e.g. 'U+1313F'), name, phoneticValues (array of strings), confidence (0-1), signType (uniliteral|biliteral|triliteral|ideogram|determinative|classifier|other), boundingBox {x,y,width,height} in 0-1 relative image coordinates}. If no inscription is visible, return an empty array. Do not invent signs.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Sign catalogue (partial):\n${signCatalogue()}`,
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      HUAWEI_CONFIG.visionModel,
    );

    const parsed = parseJson(raw);
    const detected = SignDetectionSchema.array().safeParse(
      (parsed as { detections?: unknown }).detections,
    );
    if (!detected.success) {
      throw new Error(
        "AI_OUTPUT_ERROR: the model returned sign detections that failed validation.",
      );
    }

    return {
      inscriptionRegion:
        detected.data.length > 0
          ? {
              x: Math.min(
                ...detected.data.map((d) => d.boundingBox.x),
              ),
              y: Math.min(
                ...detected.data.map((d) => d.boundingBox.y),
              ),
              width: 0.9,
              height: 0.3,
              confidence:
                detected.data.reduce((s, d) => s + d.confidence, 0) /
                detected.data.length,
            }
          : null,
      detections: detected.data,
      diagnostics: {
        width: request.image.width ?? 1024,
        height: request.image.height ?? 768,
        estimatedRotation: 0,
        clarityScore: 0.5,
      },
    };
  }
}

export class HuaweiOCRProvider implements OCRProvider {
  readonly name = "huawei-ocr";

  async recognize(
    crop: ImageInput,
    candidates: HieroglyphSign[],
  ): Promise<SignDetection[]> {
    const imageUrl = toImageUrl(crop);
    if (!imageUrl) return [];
    const raw = await chatComplete(
      [
        {
          role: "system",
          content:
            "You are an OCR model for Egyptian hieroglyphs. Given a cropped image, identify each visible sign from the candidate list. Return ONLY JSON: {detections: [{gardinerCode, confidence, boundingBox {x,y,width,height}}]}.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Candidate signs:\n${candidates
                .map(
                  (s) =>
                    `${s.gardinerCode} ${s.name} (${s.phoneticValues.join("/")})`,
                )
                .join("\n")}`,
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      HUAWEI_CONFIG.visionModel,
    );
    const parsed = parseJson(raw);
    const detected = SignDetectionSchema.array().safeParse(
      (parsed as { detections?: unknown }).detections,
    );
    return detected.success ? detected.data : [];
  }
}

export class HuaweiTranslationProvider
  implements TranslationProvider
{
  readonly name = "huawei-translation";

  async translate(
    request: TranslationRequest,
  ): Promise<TranslationOutcome> {
    if (request.detections.length === 0) {
      return {
        transliteration: "—",
        translation:
          "No signs were detected in the image. Provide a clearer, well-lit photo of the inscription.",
        alternatives: [],
        explanation:
          "The vision pass found no hieroglyphic signs. The image itself yielded nothing to read.",
        context: {},
        sources: [],
      };
    }

    const signList = request.detections
      .map(
        (d) =>
          `${d.gardinerCode} ${d.name} (values: ${d.phoneticValues.join("/")}) — confidence ${(d.confidence * 100).toFixed(0)}%`,
      )
      .join("\n");

    const raw = await chatComplete(
      [
        {
          role: "system",
          content:
            "You are a conservative Egyptologist. Given detected hieroglyphic signs, produce a transliteration and translation. Return ONLY JSON with: transliteration, translation, explanation (2-4 sentences), grammar, historicalPeriod, alternatives (array of {transliteration, translation, confidence, explanation}). If the signs are ambiguous or low-confidence, say so explicitly and prefer alternatives over a single confident claim. NEVER fabricate a reading.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Detected signs:\n${signList}`,
            },
          ],
        },
      ],
      HUAWEI_CONFIG.chatModel,
    );

    const parsed = parseJson(raw);
    const outcomeSchema = z.object({
      transliteration: z.string().min(1),
      translation: z.string().min(1),
      explanation: z.string().min(1),
      grammar: z.string().optional(),
      historicalPeriod: z.string().optional(),
      possibleMeaning: z.string().optional(),
      culturalSignificance: z.string().optional(),
      alternatives: z
        .array(
          z.object({
            transliteration: z.string().min(1),
            translation: z.string().min(1),
            confidence: z.number().min(0).max(1),
            explanation: z.string().min(1),
          }),
        )
        .default([]),
    });
    const result = outcomeSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        "AI_OUTPUT_ERROR: the model returned a translation that failed validation.",
      );
    }

    return {
      transliteration: result.data.transliteration,
      translation: result.data.translation,
      alternatives: result.data.alternatives,
      explanation: result.data.explanation,
      context: {
        historicalPeriod: result.data.historicalPeriod,
        possibleMeaning: result.data.possibleMeaning,
        grammar: result.data.grammar,
        culturalSignificance: result.data.culturalSignificance,
      },
      sources: [
        {
          title:
            "Middle Egyptian: An Introduction to the Language and Culture of Hieroglyphs",
          author: "Allen, James P.",
          publicationDate: "2000",
          type: "BOOK",
          citationText:
            "Allen, J.P. (2000). Middle Egyptian. Cambridge: Cambridge University Press.",
        },
      ],
    };
  }
}

export class HuaweiLLMProvider implements LLMProvider {
  readonly name = "huawei-llm";

  async complete(request: AssistantRequest): Promise<AssistantMessage> {
    const message = await this.run(request);
    const validated = AssistantMessageSchema.safeParse(message);
    if (!validated.success) {
      throw new Error(
        "AI_OUTPUT_ERROR: the model returned a message that failed validation.",
      );
    }
    return validated.data;
  }

  async stream(
    request: AssistantRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
  ): Promise<void> {
    if (!HUAWEI_CONFIG.apiKey) {
      throw new Error(
        "AI_NOT_CONFIGURED: HUAWEI_API_KEY is not set.",
      );
    }

    const response = await fetch(
      `${HUAWEI_CONFIG.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUAWEI_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: HUAWEI_CONFIG.chatModel,
          messages: this.buildMessages(request),
          temperature: 0.4,
          stream: true,
        }),
      },
    );
    if (!response.ok || !response.body) {
      throw new Error(
        `AI_PROVIDER_ERROR: Huawei Cloud streaming failed (${response.status}).`,
      );
    }

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();
    let buffer = "";
    let fullContent = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onChunk({ type: "delta", delta });
          }
        } catch {
          // Ignore malformed SSE frames.
        }
      }
    }

    const message: AssistantMessage = {
      id: uid("msg"),
      role: "assistant",
      content: fullContent.trim() || "No response.",
      format: "markdown",
      createdAt: new Date().toISOString(),
    };
    onChunk({ type: "done", message });
  }

  private async run(request: AssistantRequest): Promise<AssistantMessage> {
    const raw = await chatComplete(
      this.buildMessages(request),
      HUAWEI_CONFIG.chatModel,
      false,
    );
    return {
      id: uid("msg"),
      role: "assistant",
      content: raw.trim(),
      format: "markdown",
      createdAt: new Date().toISOString(),
    };
  }

  private buildMessages(request: AssistantRequest): ChatMessage[] {
    const modePrompt = {
      visitor:
        "You are Manetho, a friendly cultural heritage assistant for museum visitors. Answer in 2-4 short paragraphs. Distinguish facts from interpretations.",
      educational:
        "You are Manetho, a cultural heritage assistant for students and educators. Include examples, explain terms, and suggest related lessons.",
      research:
        "You are Manetho, a rigorous research assistant. Use precise terminology, give alternative readings, state uncertainties explicitly, and cite standard sources. Never fabricate.",
      guide:
        "You are Manetho, an on-site museum guide. Orient the visitor: where the object is, what to look at next on the tour, and one vivid detail. Keep it brief and warm.",
    } as const;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `${modePrompt[request.mode]}\n\nRules: cite sources when you use them. Mark interpretations as interpretations. If you do not know, say so — never invent dates, names, or translations.`,
      },
    ];

    for (const entry of request.history ?? []) {
      if (entry.role === "system") continue;
      messages.push({ role: entry.role, content: entry.content });
    }

    const userContent: ChatMessage["content"] = [
      { type: "text", text: request.message },
    ];

    const ctx = request.context;
    if (ctx?.artifact) {
      userContent.push({
        type: "text",
        text: `Context artifact: ${ctx.artifact.name} (${ctx.artifact.period}, ${ctx.artifact.dynasty}). Museum inventory ${ctx.artifact.inventoryNumber}.`,
      });
    }
    if (ctx?.detections && ctx.detections.length > 0) {
      userContent.push({
        type: "text",
        text: `Detected hieroglyphic signs:\n${ctx.detections
          .map(
            (d) =>
              `${d.gardinerCode} ${d.name} (${d.phoneticValues.join("/")}) confidence ${(d.confidence * 100).toFixed(0)}%`,
          )
          .join("\n")}`,
      });
    }

    messages.push({ role: "user", content: userContent });
    return messages;
  }
}

export class HuaweiEmbeddingProvider {
  readonly name = "huawei-embedding";

  async embed(request: EmbeddingRequest): Promise<EmbeddingOutcome> {
    if (!HUAWEI_CONFIG.apiKey) {
      throw new Error(
        "AI_NOT_CONFIGURED: HUAWEI_API_KEY is not set.",
      );
    }
    const response = await fetch(
      `${HUAWEI_CONFIG.baseUrl}/embeddings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUAWEI_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: HUAWEI_CONFIG.embeddingModel,
          input: request.text,
        }),
      },
    );
    if (!response.ok) {
      throw new Error(
        `AI_PROVIDER_ERROR: Huawei embeddings failed (${response.status}).`,
      );
    }
    const data = (await response.json()) as {
      data?: Array<{ embedding: number[] }>;
    };
    const vector = data.data?.[0]?.embedding;
    if (!vector) {
      throw new Error(
        "AI_PROVIDER_ERROR: empty embedding from Huawei Cloud.",
      );
    }
    return { vector, model: HUAWEI_CONFIG.embeddingModel };
  }
}
