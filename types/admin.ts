import type { Source, UUID } from "./common";

export interface AIRequestRecord {
  id: UUID;
  userId?: UUID;
  type: "translation" | "assistant" | "vision" | "embedding" | "stt" | "tts";
  provider: string;
  model: string;
  status: "success" | "error" | "pending";
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  promptVersion?: string;
  createdAt: string;
}

export interface AIUsageSummary {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  averageLatencyMs: number;
  byProvider: Record<string, number>;
  byType: Record<string, number>;
}

export interface AIConfig {
  provider: string;
  models: {
    llm: string;
    vision?: string;
    embedding?: string;
  };
  prompts: { version: string; name: string }[];
}

export interface FeedbackRecord {
  id: UUID;
  targetType: "assistant" | "translation";
  targetId: string;
  rating: "up" | "down";
  note?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: UUID;
  actorId?: UUID;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type { Source, UUID };
