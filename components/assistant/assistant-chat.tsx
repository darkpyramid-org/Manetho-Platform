"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  BookOpen,
  Mic,
  MicOff,
  Send,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { AssistantMode } from "@/types/common";
import {
  buildHistory,
  useAssistantStore,
  type ChatMessage,
} from "@/lib/stores/assistant-store";
import { Button, IconButton } from "@/components/ui/button";
import { Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const MODES: AssistantMode[] = ["visitor", "educational", "research", "guide"];

/**
 * Assistant chat (spec §74, §75).
 *
 * Streams the reply over SSE, shows citations, and separates
 * what the assistant claims from what it cites. When the
 * provider fails, the error is shown plainly — the chat never
 * invents a placeholder answer.
 */
export function AssistantChat() {
  const t = useTranslations("assistant");
  const te = useTranslations("errors");
  const locale = useLocale();

  const messages = useAssistantStore((state) => state.messages);
  const mode = useAssistantStore((state) => state.mode);
  const context = useAssistantStore((state) => state.context);
  const streaming = useAssistantStore((state) => state.streaming);
  const error = useAssistantStore((state) => state.error);
  const speechEnabled = useAssistantStore((state) => state.speechEnabled);

  const setMode = useAssistantStore((state) => state.setMode);
  const addUserMessage = useAssistantStore((state) => state.addUserMessage);
  const startAssistantMessage = useAssistantStore(
    (state) => state.startAssistantMessage,
  );
  const appendToStream = useAssistantStore((state) => state.appendToStream);
  const finishStream = useAssistantStore((state) => state.finishStream);
  const setError = useAssistantStore((state) => state.setError);
  const clearConversation = useAssistantStore(
    (state) => state.clearConversation,
  );
  const setSpeechEnabled = useAssistantStore(
    (state) => state.setSpeechEnabled,
  );
  const setFeedback = useAssistantStore((state) => state.setFeedback);

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      addUserMessage(trimmed);
      setInput("");
      startAssistantMessage();

      try {
        const response = await fetch("/api/ai/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            mode,
            locale,
            history: buildHistory(messages),
            context: context
              ? {
                  artifactId: context.artifactId,
                  museumId: context.museumId,
                  tourId: context.tourId,
                  translationResult: context.translationResult,
                  detections: context.detections,
                }
              : undefined,
          }),
        });

        if (!response.ok || !response.body) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            payload?.error?.message ?? te("aiUnavailable"),
          );
        }

        await readEventStream(response.body, {
          onDelta: (delta) => appendToStream(delta),
          onDone: (message) =>
            finishStream({
              content: message.content,
              citations: message.citations,
              artifactCards: message.artifactCards,
              signCards: message.signCards,
            }),
          onError: (message) => setError(message),
        });
      } catch (exception) {
        setError(
          exception instanceof Error ? exception.message : te("generic"),
        );
      }
    },
    [
      addUserMessage,
      appendToStream,
      context,
      finishStream,
      locale,
      messages,
      mode,
      setError,
      startAssistantMessage,
      streaming,
      te,
    ],
  );

  const toggleListening = useCallback(() => {
    const Recognition =
      typeof window !== "undefined"
        ? (window as WindowWithSpeech).SpeechRecognition ??
          (window as WindowWithSpeech).webkitSpeechRecognition
        : undefined;

    if (!Recognition) {
      setError(t("voiceUnsupported"));
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = locale === "ar" ? "ar-EG" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      setError(t("voiceUnsupported"));
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [listening, locale, setError, t]);

  const speak = useCallback(
    (message: ChatMessage) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.lang = locale === "ar" ? "ar-EG" : "en-US";
      window.speechSynthesis.speak(utterance);
    },
    [locale],
  );

  const suggestions = [
    t("suggestion1"),
    t("suggestion2"),
    t("suggestion3"),
    t("suggestion4"),
  ];

  const isEmpty = messages.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="flex min-h-[32rem] flex-col rounded-xl border border-ash/70 bg-charcoal">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-5 overflow-y-auto p-5"
          aria-live="polite"
          aria-busy={streaming}
        >
          {isEmpty ? (
            <div className="py-10 text-center">
              <h2 className="font-display text-2xl text-papyrus">
                {t("emptyTitle")}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-sandstone/80">
                {t("emptyBody")}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onFeedback={(value) => setFeedback(message.id, value)}
                onSpeak={() => speak(message)}
                canSpeak={speechEnabled}
                speakLabel={t("voiceSpeak")}
              />
            ))
          )}

          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </div>

        {/* Suggestions */}
        {isEmpty ? (
          <div className="border-t border-ash/60 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-sandstone/60">
              {t("suggestions")}
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void send(suggestion)}
                    className="rounded-full border border-ash text-start"
                  >
                    {suggestion}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Composer */}
        <form
          className="flex items-end gap-2 border-t border-ash/60 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <label htmlFor="assistant-input" className="sr-only">
            {t("placeholder")}
          </label>
          <textarea
            id="assistant-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder={t("placeholder")}
            className="max-h-32 min-h-11 flex-1 resize-y rounded-md border border-ash bg-obsidian px-3 py-2.5 text-sm text-papyrus placeholder:text-mist focus:border-gold/60 focus:outline-none"
          />
          <IconButton
            label={listening ? t("voiceStop") : t("voiceStart")}
            onClick={toggleListening}
            aria-pressed={listening}
            variant={listening ? "danger" : "ghost"}
          >
            {listening ? (
              <Square className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Mic className="h-4 w-4" aria-hidden="true" />
            )}
          </IconButton>
          <Button type="submit" disabled={streaming || input.trim() === ""}>
            {streaming ? (
              <Spinner label={t("thinking")} />
            ) : (
              <>
                <Send className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                <span className="sr-only">{t("send")}</span>
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Side panel */}
      <aside className="space-y-4">
        <div className="rounded-lg border border-ash/70 bg-charcoal p-4">
          <h2 className="font-display text-sm uppercase tracking-widest text-gold">
            {t("modes")}
          </h2>
          <div role="radiogroup" aria-label={t("modes")} className="mt-3 space-y-1.5">
            {MODES.map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="radio"
                aria-checked={mode === candidate}
                onClick={() => setMode(candidate)}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-start text-sm transition-colors",
                  mode === candidate
                    ? "border-gold bg-gold/12 text-gold-bright"
                    : "border-ash text-sandstone hover:border-gold/40",
                )}
              >
                {t(`mode${candidate.charAt(0).toUpperCase()}${candidate.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-ash/70 bg-charcoal p-4">
          <h2 className="font-display text-sm uppercase tracking-widest text-gold">
            {t("contextPanel")}
          </h2>
          {context ? (
            <dl className="mt-3 space-y-2 text-sm">
              {context.artifactName ? (
                <div>
                  <dt className="text-xs text-sandstone/60">
                    {t("contextArtifact")}
                  </dt>
                  <dd className="text-papyrus">{context.artifactName}</dd>
                </div>
              ) : null}
              {context.museumName ? (
                <div>
                  <dt className="text-xs text-sandstone/60">
                    {t("contextMuseum")}
                  </dt>
                  <dd className="text-papyrus">{context.museumName}</dd>
                </div>
              ) : null}
              {context.translationResult ? (
                <div>
                  <dt className="text-xs text-sandstone/60">
                    {t("contextInscription")}
                  </dt>
                  <dd dir="ltr" className="font-mono text-gold">
                    {context.translationResult.transliteration}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-sandstone/60">
              {t("clearContext")}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-ash/70 bg-charcoal p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-widest text-gold">
              {t("voiceTitle")}
            </h2>
            <IconButton
              label={speechEnabled ? t("voiceOff") : t("voiceSpeak")}
              onClick={() => setSpeechEnabled(!speechEnabled)}
              aria-pressed={speechEnabled}
              className="h-7 w-7"
            >
              {speechEnabled ? (
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </IconButton>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-sandstone/70">
            {listening ? (
              <>
                <MicOff className="h-3.5 w-3.5 text-danger" aria-hidden="true" />
                {t("voiceListening")}
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                {t("voiceStart")}
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-ash/70 bg-charcoal p-4">
          <p className="text-xs leading-relaxed text-sandstone/70">
            {t("disclaimer")}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearConversation}>
              {t("clear")}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function MessageBubble({
  message,
  onFeedback,
  onSpeak,
  canSpeak,
  speakLabel,
}: {
  message: ChatMessage;
  onFeedback: (value: "up" | "down") => void;
  onSpeak: () => void;
  canSpeak: boolean;
  speakLabel: string;
}) {
  const t = useTranslations("assistant");
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[min(46rem,88%)] rounded-xl px-4 py-3",
          isUser
            ? "bg-gold/15 text-papyrus"
            : "border border-ash/70 bg-obsidian text-papyrus",
        )}
      >
        {message.content ? (
          <Markdown text={message.content} />
        ) : message.streaming ? (
          <span className="flex items-center gap-2 text-sm text-sandstone/70">
            <Spinner label={t("thinking")} />
            {t("thinking")}
          </span>
        ) : null}

        {message.citations && message.citations.length > 0 ? (
          <div className="mt-3 border-t border-ash/60 pt-3">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-sandstone/60">
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              {t("citations")}
            </p>
            <ul className="mt-1.5 space-y-1">
              {message.citations.map((citation, index) => (
                <li key={`${citation.title}-${index}`} className="text-xs text-sandstone/80">
                  {citation.url ? (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline"
                    >
                      {citation.title}
                    </a>
                  ) : (
                    citation.title
                  )}
                  {citation.author ? ` — ${citation.author}` : ""}
                  {citation.year ? ` (${citation.year})` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!isUser && !message.streaming && message.content ? (
          <div className="mt-3 flex items-center gap-1 border-t border-ash/60 pt-2.5">
            <span className="me-1 text-xs text-sandstone/50">
              {t("feedback")}
            </span>
            <IconButton
              label={t("thumbsUp")}
              onClick={() => onFeedback("up")}
              className={cn(
                "h-7 w-7",
                message.feedback === "up" && "text-success",
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
            </IconButton>
            <IconButton
              label={t("thumbsDown")}
              onClick={() => onFeedback("down")}
              className={cn(
                "h-7 w-7",
                message.feedback === "down" && "text-danger",
              )}
            >
              <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
            </IconButton>
            {canSpeak ? (
              <IconButton
                label={speakLabel}
                onClick={onSpeak}
                className="ms-auto h-7 w-7"
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              </IconButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Minimal Markdown renderer.
 *
 * Deliberately small and non-HTML-emitting: assistant output
 * is model-generated text, so it is rendered as text with a
 * few typographic conventions rather than injected as HTML.
 * That removes a whole class of injection risk by design.
 */
function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed === "---") {
          return <hr key={index} className="border-ash/60" />;
        }

        const isItalicBlock = trimmed.startsWith("*") && trimmed.endsWith("*");
        if (isItalicBlock) {
          return (
            <p key={index} className="text-xs italic text-sandstone/60">
              {trimmed.replace(/^\*|\*$/g, "")}
            </p>
          );
        }

        const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
        if (heading) {
          return (
            <p
              key={index}
              className="font-display text-base text-papyrus"
            >
              {heading[2]}
            </p>
          );
        }

        if (/^[-*]\s+/m.test(trimmed)) {
          const items = trimmed
            .split("\n")
            .filter((line) => /^[-*]\s+/.test(line))
            .map((line) => line.replace(/^[-*]\s+/, ""));
          return (
            <ul key={index} className="list-inside list-disc space-y-1">
              {items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline text={item} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index}>
            <Inline text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

/** Handles **bold**, `code` and line breaks within a block. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-papyrus">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              dir="ltr"
              className="rounded bg-slate px-1 py-0.5 font-mono text-xs text-gold"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

/* ── SSE reader ─────────────────────────────────────────── */

interface ServerDoneMessage {
  id: string;
  content: string;
  citations?: ChatMessage["citations"];
  artifactCards?: string[];
  signCards?: string[];
}

async function readEventStream(
  body: ReadableStream<Uint8Array>,
  handlers: {
    onDelta: (delta: string) => void;
    onDone: (message: ServerDoneMessage) => void;
    onError: (message: string) => void;
  },
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    // Decode incrementally: SSE frames can straddle chunk
    // boundaries, so the decoder must run in streaming mode.
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      let event = "message";
      const dataLines: string[] = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) {
          event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }
      if (dataLines.length === 0) continue;

      let payload: unknown;
      try {
        payload = JSON.parse(dataLines.join("\n"));
      } catch {
        continue;
      }

      if (event === "delta") {
        const delta = (payload as { delta?: string }).delta;
        if (delta) handlers.onDelta(delta);
      } else if (event === "done") {
        const message = (payload as { message?: ServerDoneMessage }).message;
        if (message) handlers.onDone(message);
      } else if (event === "error") {
        const error = payload as { message?: string };
        handlers.onError(
          error.message ?? "The assistant could not respond.",
        );
      }
    }
  }
}

/* ── Web Speech API types (not in lib.dom for all targets) ── */

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}