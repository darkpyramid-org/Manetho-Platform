"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Sparkles, Wrench } from "lucide-react";
import { useRouter } from "@/lib/i18n/navigation";
import { useTranslatorStore } from "@/lib/stores/translator-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/input";
import {
  AnalyzingPanel,
  ImageIntake,
  ResetButton,
  SamplePicker,
} from "@/components/translator/image-intake";
import { TranslationResultView } from "@/components/translator/translation-result";
import { hieroglyphRepository } from "@/lib/data";
import type { TranslationResult } from "@/types/hieroglyph";

/**
 * Translator workspace (spec §20, §23, §77).
 *
 * The page owns no recognition logic — it collects input,
 * calls the API, and renders whatever comes back, including
 * the failure state.
 */
export function Translator({
  samples,
}: {
  samples: Array<{
    id: string;
    label: string;
    image: string;
    glyphs: string;
    width: number;
    height: number;
  }>;
}) {
  const t = useTranslations("translate");
  const te = useTranslations("errors");
  const router = useRouter();

  const status = useTranslatorStore((state) => state.status);
  const imageDataUrl = useTranslatorStore((state) => state.imageDataUrl);
  const crop = useTranslatorStore((state) => state.crop);
  const result = useTranslatorStore((state) => state.result);
  const error = useTranslatorStore((state) => state.error);
  const setResult = useTranslatorStore((state) => state.setResult);
  const setError = useTranslatorStore((state) => state.setError);
  const reset = useTranslatorStore((state) => state.reset);

  const [showManual, setShowManual] = useState(false);

  const analyze = useCallback(async () => {
    if (!imageDataUrl) return;
    setError(null);
    useTranslatorStore.setState({ status: "analyzing" });

    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: {
            dataUrl: imageDataUrl,
            filename: useTranslatorStore.getState().imageFileName,
            width: useTranslatorStore.getState().imageDimensions?.width,
            height: useTranslatorStore.getState().imageDimensions?.height,
          },
          ...(crop
            ? {
                context: {
                  historicalPeriod: "As photographed — period unknown",
                },
              }
            : {}),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ?? te("generic"),
        );
      }

      setResult(payload.data as TranslationResult);
    } catch (exception) {
      setError(
        exception instanceof Error ? exception.message : te("generic"),
      );
    }
  }, [crop, imageDataUrl, setError, setResult, te]);

  return (
    <div className="space-y-8">
      {/* ── Intake ───────────────────────────────────── */}
      {!result && status !== "analyzing" ? (
        <>
          <ImageIntake />

          {imageDataUrl ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("resultTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative overflow-hidden rounded-lg border border-ash bg-obsidian">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageDataUrl}
                    alt={t("dropzone")}
                    className="block max-h-[26rem] w-full object-contain"
                  />
                  {crop ? (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute border-2 border-gold bg-gold/5"
                      style={{
                        left: `${crop.x * 100}%`,
                        top: `${crop.y * 100}%`,
                        width: `${crop.width * 100}%`,
                        height: `${crop.height * 100}%`,
                      }}
                    />
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={analyze}>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    {t("resultTitle")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowManual((value) => !value)}
                  >
                    <Wrench className="h-4 w-4" aria-hidden="true" />
                    {t("manuallySelect")}
                  </Button>
                  <ResetButton />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}

          {showManual ? <ManualSignPicker /> : null}

          <SamplePicker samples={samples} />
        </>
      ) : null}

      {/* ── Analyzing ────────────────────────────────── */}
      {status === "analyzing" ? (
        <>
          <AnalyzingPanel />
          <div className="flex justify-end">
            <ResetButton />
          </div>
        </>
      ) : null}

      {/* ── Result ───────────────────────────────────── */}
      {result ? (
        <>
          <TranslationResultView
            result={result}
            onAskAssistant={() => router.push("/assistant")}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={reset}>
              {t("translateAnother")}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * Manual sign selection (spec §20).
 * The escape hatch when recognition is not confident: the
 * visitor picks the signs and Manetho transliterates them.
 */
function ManualSignPicker() {
  const t = useTranslations("translate");
  const manualSigns = useTranslatorStore((state) => state.manualSigns);
  const addManualSign = useTranslatorStore((state) => state.addManualSign);
  const removeManualSign = useTranslatorStore(
    (state) => state.removeManualSign,
  );
  const clearManualSigns = useTranslatorStore(
    (state) => state.clearManualSigns,
  );

  // A small, useful palette: the uniliterals plus the most
  // common triliterals.
  const palette = [
    "G001", "D021", "G017", "N035", "X001", "D046", "R008", "S034",
    "O001", "F035", "L001", "G005", "R011", "D010", "V010", "Y003",
  ];

  const signs = palette
    .map((code) => signLookup(code))
    .filter((sign): sign is NonNullable<typeof sign> => Boolean(sign));

  const reading = manualSigns
    .map((code) => signs.find((sign) => sign.gardinerCode === code))
    .filter(Boolean)
    .map((sign) => sign!.phoneticValues.join("") || sign!.ideographicMeaning || sign!.name)
    .join(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("manualSelection")}</CardTitle>
        <p className="mt-1 text-sm text-sandstone/80">
          {t("manuallySelectHint")}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label>{t("addSign")}</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {signs.map((sign) => {
              const selected = manualSigns.includes(sign.gardinerCode);
              return (
                <button
                  key={sign.gardinerCode}
                  type="button"
                  onClick={() =>
                    selected
                      ? removeManualSign(sign.gardinerCode)
                      : addManualSign(sign.gardinerCode)
                  }
                  aria-pressed={selected}
                  title={`${sign.gardinerCode} — ${sign.name}`}
                  className={
                    selected
                      ? "grid h-12 w-12 place-items-center rounded-md border-2 border-gold bg-gold/15 text-gold"
                      : "grid h-12 w-12 place-items-center rounded-md border border-ash bg-charcoal text-gold transition-colors hover:border-gold/50"
                  }
                >
                  <span className="hiero text-2xl leading-none" aria-hidden="true">
                    {sign.glyph}
                  </span>
                  <span className="sr-only">
                    {sign.gardinerCode} {sign.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label>{t("selectedSigns")}</Label>
          {manualSigns.length === 0 ? (
            <p className="mt-2 text-sm text-sandstone/60">
              {t("noSelection")}
            </p>
          ) : (
            <>
              <p className="hiero mt-3 flex flex-wrap gap-2 text-3xl text-gold">
                {manualSigns.map((code) => {
                  const sign = signs.find(
                    (entry) => entry.gardinerCode === code,
                  );
                  return (
                    <span
                      key={code}
                      className="grid h-14 w-14 place-items-center rounded-md border border-gold/40 bg-obsidian"
                    >
                      <span aria-hidden="true">{sign?.glyph ?? code}</span>
                    </span>
                  );
                })}
              </p>
              <p
                dir="ltr"
                className="mt-3 font-mono text-lg text-gold-bright"
              >
                {reading}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearManualSigns}
                >
                  {t("reset")}
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Local sign lookup so the palette renders without a fetch. */
function signLookup(code: string) {
  return hieroglyphRepository.get(code);
}