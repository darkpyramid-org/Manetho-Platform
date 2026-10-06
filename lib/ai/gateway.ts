import { uid, confidenceLabel } from "@/lib/utils";
import type { Artifact, Museum } from "@/types/museum";
import type {
  HieroglyphSign,
  SignDetection,
  TranslationResult,
} from "@/types/hieroglyph";
import { TranslationResultSchema } from "@/lib/ai/schemas";
import type {
  AIProviderBundle,
  AIProviderName,
  AssistantMessage,
  AssistantRequest,
  ImageInput,
  LLMStreamChunk,
  TranslationOutcome,
} from "@/lib/ai/types";
import {
  MockVisionProvider,
  MockOCRProvider,
  MockTranslationProvider,
} from "@/lib/ai/providers/mock-vision";
import {
  MockLLMProvider,
  MockEmbeddingProvider,
  MockSTTProvider,
  MockTTSProvider,
} from "@/lib/ai/providers/mock-llm";
import {
  OpenAIVisionProvider,
  OpenAIOCRProvider,
  OpenAITranslationProvider,
  OpenAILLMProvider,
  OpenAIEmbeddingProvider,
} from "@/lib/ai/providers/openai";
import {
  HuaweiVisionProvider,
  HuaweiOCRProvider,
  HuaweiTranslationProvider,
  HuaweiLLMProvider,
  HuaweiEmbeddingProvider,
} from "@/lib/ai/providers/huawei";
import {
  LocalVisionProvider,
  LocalOCRProvider,
  LocalTranslationProvider,
  LocalLLMProvider,
  LocalEmbeddingProvider,
} from "@/lib/ai/providers/local";
import { aiProvider } from "@/lib/features";
import { hieroglyphRepository } from "@/lib/data";

/**
 * AI gateway (spec §21, §58).
 *
 * The single entry point for all AI work.
 * The application never touches a provider
 * directly: it asks the gateway, which
 * selects the configured provider bundle,
 * orchestrates the pipeline, and validates
 * every result with Zod before returning it.
 */

export type TranslationContext = {
  artifact?: Artifact;
  museum?: Museum;
  historicalPeriod?: string;
};

/** Build the provider bundle for the configured provider. */
export function getProviderBundle(
  provider?: AIProviderName,
): AIProviderBundle {
  const name = provider ?? aiProvider();

  switch (name) {
    case "openai":
      return {
        vision: new OpenAIVisionProvider(),
        ocr: new OpenAIOCRProvider(),
        translation: new OpenAITranslationProvider(),
        llm: new OpenAILLMProvider(),
        embedding: new OpenAIEmbeddingProvider(),
      };
    case "huawei":
      return {
        vision: new HuaweiVisionProvider(),
        ocr: new HuaweiOCRProvider(),
        translation: new HuaweiTranslationProvider(),
        llm: new HuaweiLLMProvider(),
        embedding: new HuaweiEmbeddingProvider(),
      };
    case "local":
      return {
        vision: new LocalVisionProvider(),
        ocr: new LocalOCRProvider(),
        translation: new LocalTranslationProvider(),
        llm: new LocalLLMProvider(),
        embedding: new LocalEmbeddingProvider(),
      };
    case "mock":
    default:
      return {
        vision: new MockVisionProvider(),
        ocr: new MockOCRProvider(),
        translation: new MockTranslationProvider(),
        llm: new MockLLMProvider(),
        embedding: new MockEmbeddingProvider(),
        // Voice is provided by the browser speech APIs in
        // development. The mock STT/TTS deliberately fail
        // loudly rather than fabricate audio.
        stt: new MockSTTProvider(),
        tts: new MockTTSProvider(),
      };
  }
}

/**
 * The full inscription-translation pipeline (spec §20):
 * image → vision inspection → (optional OCR refinement)
 * → translation → validated TranslationResult.
 */
export async function translateInscription(
  image: ImageInput,
  context: TranslationContext = {},
  provider?: AIProviderName,
): Promise<TranslationResult> {
  const bundle = getProviderBundle(provider);
  const requestId = uid("req");
  const imageId = uid("img");

  // 1. Vision pass: detect the inscription and its signs.
  const inspection = await bundle.vision.inspect({
    image,
    language: "en",
  });

  let detections = inspection.detections;

  // 2. OCR refinement pass when crops are available.
  if (detections.length > 0 && image.dataUrl) {
    try {
      const candidates = detections
        .map((d) => d.gardinerCode)
        .map((code) => hieroglyphRepository.get(code))
        .filter((s): s is HieroglyphSign => Boolean(s));
      if (candidates.length > 0) {
        const refined = await bundle.ocr.recognize(image, candidates);
        if (refined.length > 0) {
          // Keep the higher-confidence result per sign.
          detections = refined.map((refinedDetection) => {
            const original = detections.find(
              (d) => d.gardinerCode === refinedDetection.gardinerCode,
            );
            return refinedDetection.confidence >=
              (original?.confidence ?? 0)
              ? refinedDetection
              : original ?? refinedDetection;
          });
        }
      }
    } catch {
      // OCR is a refinement; a failure here must not
      // fail the whole pipeline — the vision result
      // still stands.
    }
  }

  // 3. Translation pass: transliteration + translation.
  const outcome: TranslationOutcome =
    await bundle.translation.translate({
      detections,
      language: "en",
      context: {
        artifact: context.artifact,
        museum: context.museum,
        historicalPeriod:
          context.historicalPeriod ??
          context.artifact?.period,
      },
    });

  // 4. Normalise and validate the final result.
  const meanConfidence =
    detections.length > 0
      ? detections.reduce((sum, d) => sum + d.confidence, 0) /
        detections.length
      : 0;

  const isDemo = aiProvider() === "mock";

  const rawResult = {
    requestId,
    imageId,
    status:
      detections.length === 0 || meanConfidence < 0.6
        ? ("low_confidence" as const)
        : ("completed" as const),
    detections: detections.map((d) => ({
      ...d,
      confidenceLevel:
        d.confidenceLevel ?? confidenceLabel(d.confidence),
    })),
    transliteration: outcome.transliteration,
    translation: outcome.translation,
    alternatives: outcome.alternatives.map((alt) => ({
      ...alt,
      confidenceLevel: confidenceLabel(alt.confidence),
    })),
    explanation: outcome.explanation,
    context: outcome.context ?? {},
    overallConfidence: meanConfidence,
    overallConfidenceLevel: confidenceLabel(meanConfidence),
    sources: outcome.sources.map((source) => ({
      ...source,
      id: source.id ?? uid("src"),
    })),
    isDemo,
    createdAt: new Date().toISOString(),
  };

  const validated =
    TranslationResultSchema.safeParse(rawResult);
  if (!validated.success) {
    // Never return unvalidated AI output.
    throw new Error(
      "AI_OUTPUT_ERROR: the translation result failed validation: " +
        validated.error.issues
          .map((issue) => issue.message)
          .join("; "),
    );
  }

  return validated.data;
}

/** Non-streaming assistant completion. */
export async function completeAssistant(
  request: AssistantRequest,
  provider?: AIProviderName,
): Promise<AssistantMessage> {
  const bundle = getProviderBundle(provider);
  return bundle.llm.complete(request);
}

/** Streaming assistant completion. */
export async function streamAssistant(
  request: AssistantRequest,
  onChunk: (chunk: LLMStreamChunk) => void,
  provider?: AIProviderName,
): Promise<void> {
  const bundle = getProviderBundle(provider);
  await bundle.llm.stream(request, onChunk);
}

/** STT — provided by browser APIs in development. */
export async function transcribeAudio(
  audioDataUrl: string,
  language = "en",
  provider?: AIProviderName,
): Promise<{ transcript: string; language: string; confidence: number }> {
  const bundle = getProviderBundle(provider);
  const outcome = await bundle.stt?.transcribe({
    audioDataUrl,
    language,
  });
  if (!outcome) {
    throw new Error(
      "AI_NOT_CONFIGURED: no speech-to-text provider is available.",
    );
  }
  return outcome;
}

/** TTS — provided by browser APIs in development. */
export async function synthesizeSpeech(
  text: string,
  language = "en",
  provider?: AIProviderName,
): Promise<{ audioDataUrl: string; voice: string }> {
  const bundle = getProviderBundle(provider);
  const outcome = await bundle.tts?.synthesize({
    text,
    language,
  });
  if (!outcome) {
    throw new Error(
      "AI_NOT_CONFIGURED: no text-to-speech provider is available.",
    );
  }
  return outcome;
}

/** Embed text — deterministic mock by default. */
export async function embedText(
  text: string,
  provider?: AIProviderName,
): Promise<number[]> {
  const bundle = getProviderBundle(provider);
  if (!bundle.embedding) {
    // Deterministic fallback so the demo search
    // index always works.
    const fallback = await new MockEmbeddingProvider().embed({ text });
    return fallback.vector;
  }
  const outcome = await bundle.embedding.embed({ text });
  return outcome.vector;
}

export type { SignDetection, AssistantMessage, TranslationResult };
