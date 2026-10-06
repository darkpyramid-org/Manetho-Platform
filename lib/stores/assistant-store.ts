"use client";

import { create } from "zustand";
import type { AssistantMode } from "@/types/common";
import type { SignDetection } from "@/types/hieroglyph";

/**
 * Assistant state (spec §74).
 *
 * Context (the artifact you are looking at, the reading you
 * just produced, the tour stop) is attached to the store so
 * the assistant knows where you are (spec §9).
 */

export type AssistantRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: AssistantRole;
  content: string;
  /** Set while the assistant is streaming. */
  streaming?: boolean;
  /** Visitor feedback on an answer (spec §75). */
  feedback?: "up" | "down";
  citations?: Array<{
    sourceId?: string;
    title: string;
    author?: string;
    year?: string;
    url?: string;
    type: string;
  }>;
  artifactCards?: string[];
  signCards?: string[];
  createdAt: string;
}

export interface AssistantContext {
  artifactId?: string;
  museumId?: string;
  tourId?: string;
  artifactName?: string;
  museumName?: string;
  tourTitle?: string;
  translationResult?: {
    transliteration: string;
    translation: string;
    explanation: string;
    alternatives: Array<{
      transliteration: string;
      translation: string;
      confidence: number;
      explanation: string;
    }>;
  };
  detections?: SignDetection[];
}

interface AssistantState {
  messages: ChatMessage[];
  mode: AssistantMode;
  context: AssistantContext | null;
  streaming: boolean;
  speechEnabled: boolean;
  error: string | null;

  setMode: (mode: AssistantMode) => void;
  addUserMessage: (content: string) => void;
  startAssistantMessage: () => string;
  appendToStream: (delta: string) => void;
  finishStream: (patch?: Partial<ChatMessage>) => void;
  setError: (message: string | null) => void;
  setContext: (context: AssistantContext | null) => void;
  patchContext: (patch: Partial<AssistantContext>) => void;
  clearContext: () => void;
  clearConversation: () => void;
  setSpeechEnabled: (enabled: boolean) => void;
  setFeedback: (messageId: string, value: "up" | "down") => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  messages: [],
  mode: "visitor",
  context: null,
  streaming: false,
  speechEnabled: false,
  error: null,

  setMode: (mode) => set({ mode }),

  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: uid("user"),
          role: "user",
          content,
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  startAssistantMessage: () => {
    const id = uid("assistant");
    set((state) => ({
      streaming: true,
      error: null,
      messages: [
        ...state.messages,
        {
          id,
          role: "assistant",
          content: "",
          streaming: true,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    return id;
  },

  appendToStream: (delta) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (!last || last.role !== "assistant") return state;
      messages[messages.length - 1] = { ...last, content: last.content + delta };
      return { messages };
    }),

  finishStream: (patch) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === "assistant") {
        messages[messages.length - 1] = {
          ...last,
          ...patch,
          streaming: false,
        };
      }
      return { messages, streaming: false };
    }),

  setError: (message) => set({ error: message, streaming: false }),

  setContext: (context) => set({ context }),

  patchContext: (patch) =>
    set((state) => ({
      context: { ...(state.context ?? {}), ...patch },
    })),

  clearContext: () => set({ context: null }),

  clearConversation: () => set({ messages: [], error: null }),

  setSpeechEnabled: (speechEnabled) => set({ speechEnabled }),

  setFeedback: (messageId, value) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? { ...message, feedback: value }
          : message,
      ),
    })),
}));

/**
 * Build the history payload for the API from the store's
 * message list. Only the last N turns are sent (spec §74).
 */
export function buildHistory(
  messages: ChatMessage[],
  limit = 10,
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .slice(-limit)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

export function useAssistantMode(): AssistantMode {
  return useAssistantStore((state) => state.mode);
}