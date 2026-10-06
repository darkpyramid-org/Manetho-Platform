import type { AssistantMode, UserRole, UUID } from "./common";

export interface UserProfile {
  id: UUID;
  name: string;
  email?: string;
  avatar?: string;
  preferredLanguage: string;
  preferredAssistantMode: AssistantMode;
  role: UserRole;
  createdAt: string;
}

export interface Conversation {
  id: UUID;
  title: string;
  mode: AssistantMode;
  artifactId?: UUID;
  translationRequestId?: UUID;
  museumId?: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: UUID;
  conversationId: UUID;
  role: "user" | "assistant" | "system";
  content: string;
  /** Markdown supported */
  format: "markdown" | "plain";
  citations?: Citation[];
  artifactCards?: string[];
  signCards?: string[];
  imageUrl?: string;
  feedback?: "up" | "down";
  createdAt: string;
}

export interface Citation {
  sourceId?: string;
  title: string;
  author?: string;
  year?: string;
  url?: string;
  type: string;
}

export interface HistoryEntry {
  id: UUID;
  kind: "translation" | "conversation" | "artifact" | "museum" | "tour";
  refId: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  createdAt: string;
}

export interface SavedItem {
  id: UUID;
  userId?: UUID;
  kind: "artifact" | "translation" | "hieroglyph" | "lesson" | "museum" | "conversation";
  refId: string;
  title: string;
  createdAt: string;
}

export interface TranslationRequestRecord {
  id: UUID;
  imageId: string;
  status: "queued" | "processing" | "completed" | "failed";
  result?: unknown;
  createdAt: string;
}
