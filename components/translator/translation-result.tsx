"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  Info,
} from "lucide-react";
import type { TranslationResult } from "@/types/hieroglyph";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge, DemoBadge } from "@/components/ui/badge";
import { ConfidenceMeter } from "@/components/ui/primitives";
import { Glyph } from "@/components/hieroglyph/sign-display";
import { cn } from "@/lib/utils";

/**
 * Translation result (spec §22, §77).
 *
 * Everything the model claims is shown with its confidence
 * and its sources. When the reading is too weak to trust,
 * this component shows the failure path rather than a
 * plausible-looking guess.
 */
export function TranslationResultView({
  result,
  onAskAssistant,
}: {
  result: TranslationResult;
  onAskAssistant?: () => void;
}) {
  const t = useTranslations("translate");
  const tc = useTranslations("common");
  const unreadable = result.status !== "completed";

  return (
    <div className="space-y-5">
      {/* ── Reading ─────────────────────────────────── */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{t("resultTitle")}</CardTitle>
            <p className="mt-1 text-xs text-sandstone/70">
              {tc("confidence")}:{" "}
              <span className="text-papyrus">
                {Math.round(result.overallConfidence * 100)}%
              </span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <ConfidenceBadge
              level={result.overallConfidenceLevel}
              value={result.overallConfidence}
            />
            {result.isDemo ? <DemoBadge label={tc("demoBadge")} /> : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {unreadable ? (
            <UnreadableNotice result={result} />
          ) : (
            <>
              <section aria-labelledby="transliteration-heading">
                <h3
                  id="transliteration-heading"
                  className="text-xs uppercase tracking-widest text-sandstone/60"
                >
                  {t("transliteration")}
                </h3>
                <p
                  dir="ltr"
                  className="mt-2 font-mono text-2xl text-gold-bright"
                >
                  {result.transliteration}
                </p>
              </section>

              <section aria-labelledby="translation-heading">
                <h3
                  id="translation-heading"
                  className="text-xs uppercase tracking-widest text-sandstone/60"
                >
                  {t("translation")}
                </h3>
                <p className="mt-2 text-xl font-display leading-snug text-papyrus">
                  {result.translation}
                </p>
              </section>

              <section aria-labelledby="explanation-heading">
                <h3
                  id="explanation-heading"
                  className="text-xs uppercase tracking-widest text-sandstone/60"
                >
                  {t("explanation")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-sandstone/90">
                  {result.explanation}
                </p>
              </section>

              <section aria-labelledby="context-heading">
                <h3
                  id="context-heading"
                  className="text-xs uppercase tracking-widest text-sandstone/60"
                >
                  {t("context")}
                </h3>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {result.context.historicalPeriod ? (
                    <ContextItem
                      label={t("historicalPeriod")}
                      value={result.context.historicalPeriod}
                    />
                  ) : null}
                  {result.context.possibleMeaning ? (
                    <ContextItem
                      label={t("possibleMeaning")}
                      value={result.context.possibleMeaning}
                    />
                  ) : null}
                  {result.context.grammar ? (
                    <ContextItem
                      label={t("grammar")}
                      value={result.context.grammar}
                    />
                  ) : null}
                  {result.context.culturalSignificance ? (
                    <ContextItem
                      label={t("culturalSignificance")}
                      value={result.context.culturalSignificance}
                    />
                  ) : null}
                </dl>
              </section>

              {/* Alternative readings (spec §22) */}
              {result.alternatives.length > 0 ? (
                <section aria-labelledby="alternatives-heading">
                  <h3
                    id="alternatives-heading"
                    className="text-xs uppercase tracking-widest text-sandstone/60"
                  >
                    {t("alternatives")}
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {result.alternatives.map((alternative, index) => (
                      <li
                        key={`${alternative.transliteration}-${index}`}
                        className="rounded-md border border-ash/70 bg-obsidian/60 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            dir="ltr"
                            className="font-mono text-sm text-gold"
                          >
                            {alternative.transliteration}
                          </span>
                          <ConfidenceBadge
                            level={alternative.confidenceLevel}
                            value={alternative.confidence}
                          />
                        </div>
                        <p className="mt-1.5 text-sm text-papyrus">
                          {alternative.translation}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-sandstone/75">
                          {alternative.explanation}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <p className="text-xs text-sandstone/60">
                  {t("noAlternatives")}
                </p>
              )}
            </>
          )}

          <ConfidenceMeter
            value={result.overallConfidence}
            className={unreadable ? "" : "pt-2"}
          />

          <p className="flex items-start gap-2 rounded-md bg-slate/40 p-3 text-xs leading-relaxed text-sandstone/75">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t("disclaimer")}
          </p>
        </CardContent>
      </Card>

      {/* ── Detected signs ───────────────────────────── */}
      {result.detections.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("detectedSigns")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.detections.map((detection, index) => (
                <li key={detection.id}>
                  <SignDetectionCard
                    detection={detection}
                    index={index + 1}
                    label={t("signIndex", { index: index + 1 })}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Sources ─────────────────────────────────── */}
      {result.sources.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gold" aria-hidden="true" />
              {tc("sources")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {result.sources.map((source) => (
                <li
                  key={source.id}
                  className="text-xs leading-relaxed text-sandstone/80"
                >
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gold hover:underline"
                    >
                      {source.citationText}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : (
                    source.citationText
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {onAskAssistant ? (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onAskAssistant}>
            {tc("learnMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The explicit failure path (spec §77).
 * Says what happened, why, and what the visitor can do — and
 * offers no translation at all.
 */
function UnreadableNotice({ result }: { result: TranslationResult }) {
  const t = useTranslations("translate");
  const low = result.status === "low_confidence";

  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/40 bg-danger/8 p-5"
    >
      <h3 className="flex items-center gap-2 font-display text-lg text-danger">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        {low ? t("lowConfidenceTitle") : t("failureTitle")}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-sandstone/90">
        {low ? t("lowConfidenceBody") : t("failureBody")}
      </p>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-sandstone/70">
        {t("failureHints")}
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-sandstone/85">
        <li>{t("failureHint1")}</li>
        <li>{t("failureHint2")}</li>
        <li>{t("failureHint3")}</li>
        <li>{t("failureHint4")}</li>
      </ul>

      {result.transliteration && result.transliteration !== "—" ? (
        <p className="mt-4 text-xs text-sandstone/70">
          <span className="font-medium">{t("transliteration")}:</span>{" "}
          <span dir="ltr" className="font-mono text-gold">
            {result.transliteration}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ash/60 bg-obsidian/50 p-3">
      <dt className="text-[0.7rem] uppercase tracking-wide text-sandstone/60">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-papyrus">
        {value}
      </dd>
    </div>
  );
}

/** One detected sign with its confidence and identity. */
export function SignDetectionCard({
  detection,
  index,
  label,
}: {
  detection: TranslationResult["detections"][number];
  index: number;
  label: string;
}) {
  const t = useTranslations("translate");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(detection.gardinerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; the code is visible
      // on screen anyway, so failing silently is fine.
    }
  };

  return (
    <div
      className={cn(
        "h-full rounded-md border border-ash/70 bg-charcoal p-3",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded border border-gold/25 bg-obsidian">
          <Glyph glyph={detection.glyph} label={detection.name} size="md" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm text-papyrus">
              {detection.name}
            </p>
            <ConfidenceBadge
              level={detection.confidenceLevel}
              value={detection.confidence}
            />
          </div>
          <p className="mt-0.5 font-mono text-[0.7rem] text-gold">
            {detection.gardinerCode} · {detection.unicode}
          </p>
          <p className="mt-1 text-xs text-sandstone/70">
            <span className="sr-only">{label}</span>
            {detection.transliteration}
            {detection.ideographicMeaning
              ? ` · ${detection.ideographicMeaning}`
              : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <ConfidenceMeter
          value={detection.confidence}
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={copy}
          aria-label={`${t("signIndex", { index })} ${detection.gardinerCode}`}
          className="h-7 w-7"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}