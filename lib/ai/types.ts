import type {
  AssistantMode,
  SourceType,
} from "@/types/common";
import type { Artifact, Museum, MuseumTour } from "@/types/museum";
import type { HieroglyphSign, SignDetection } from "@/types/hieroglyph";

/**
 * AI provider abstractions (spec §21, §58).
 *
 * The application never talks to a vendor SDK directly.
 * Every capability is behind an interface, and every
 * provider (OpenAI, Huawei Cloud, local, mock) is
 * interchangeable. The frontend never knows which
 * provider is active.
 */

export interface ImageInput {
  /** Data URL or object-storage reference of the uploaded image. */
  dataUrl?: string;
  storageKey?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  /** Client-supplied filename, used only for demo hashing. */
  filename?: string;
}

export interface VisionRequest {
  image: ImageInput;
  language?: string;
}

export interface VisionInspection {
  /** Detected inscription region, if any (0–1 relative coords). */
  inscriptionRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  } | null;
  /** Raw detected sign candidates before normalization. */
  detections: SignDetection[];
  /** Image-level diagnostics. */
  diagnostics: {
    width: number;
    height: number;
    estimatedRotation: number;
    clarityScore: number;
  };
}

export interface TranslationRequest {
  detections: SignDetection[];
  language?: string;
  /** Optional context: artifact, museum, period. */
  context?: {
    artifact?: Artifact;
    museum?: Museum;
    historicalPeriod?: string;
  };
}

export interface TranslationOutcome {
  transliteration: string;
  translation: string;
  alternatives: Array<{
    transliteration: string;
    translation: string;
    confidence: number;
    explanation: string;
  }>;
  explanation: string;
  context: {
    historicalPeriod?: string;
    possibleMeaning?: string;
    grammar?: string;
    culturalSignificance?: string;
    references?: string;
  };
  sources: Array<{
    id?: string;
    title: string;
    author?: string;
    publisher?: string;
    type: SourceType;
    citationText: string;
    url?: string;
    publicationDate?: string;
  }>;
}

export interface AssistantRequest {
  message: string;
  mode: AssistantMode;
  language?: string;
  /** Conversation history (last N messages). */
  history?: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  /** Attached context (spec §9). */
  context?: {
    image?: ImageInput;
    translationResult?: unknown;
    detections?: SignDetection[];
    artifact?: Artifact;
    museum?: Museum;
    tour?: MuseumTour;
    position?: { x: number; y: number };
  };
}

export interface AssistantMessage {
  id: string;
  role: "assistant";
  content: string;
  /** Markdown or plain text. */
  format: "markdown" | "plain";
  citations?: Array<{
    title: string;
    author?: string;
    year?: string;
    url?: string;
    type: string;
  }>;
  /** Related entity ids surfaced as cards. */
  artifactCards?: string[];
  signCards?: string[];
  createdAt: string;
}

export interface LLMStreamChunk {
  type: "delta" | "done" | "error";
  delta?: string;
  message?: AssistantMessage;
  error?: { code: string; message: string };
}

export interface EmbeddingRequest {
  text: string;
}

export interface EmbeddingOutcome {
  vector: number[];
  model: string;
}

export interface STTRequest {
  audioDataUrl: string;
  language?: string;
}

export interface STTOutcome {
  transcript: string;
  language: string;
  confidence: number;
}

export interface TTSRequest {
  text: string;
  language?: string;
  voice?: string;
}

export interface TTSOutcome {
  audioDataUrl: string;
  voice: string;
}

/** The seven provider interfaces (spec §58). */
export interface VisionProvider {
  readonly name: string;
  inspect(request: VisionRequest): Promise<VisionInspection>;
}

export interface OCRProvider {
  readonly name: string;
  recognize(
    crop: ImageInput,
    candidates: HieroglyphSign[],
  ): Promise<SignDetection[]>;
}

export interface TranslationProvider {
  readonly name: string;
  translate(request: TranslationRequest): Promise<TranslationOutcome>;
}

export interface LLMProvider {
  readonly name: string;
  complete(request: AssistantRequest): Promise<AssistantMessage>;
  stream(
    request: AssistantRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
  ): Promise<void>;
}

export interface EmbeddingProvider {
  readonly name: string;
  embed(request: EmbeddingRequest): Promise<EmbeddingOutcome>;
}

export interface STTProvider {
  readonly name: string;
  transcribe(request: STTRequest): Promise<STTOutcome>;
}

export interface TTSProvider {
  readonly name: string;
  synthesize(request: TTSRequest): Promise<TTSOutcome>;
}

export type AIProviderBundle = {
  vision: VisionProvider;
  ocr: OCRProvider;
  translation: TranslationProvider;
  llm: LLMProvider;
  embedding?: EmbeddingProvider;
  stt?: STTProvider;
  tts?: TTSProvider;
};

export type AIProviderName = "mock" | "openai" | "huawei" | "local";
