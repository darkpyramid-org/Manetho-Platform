"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Camera,
  Crop,
  ImageUp,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import { useTranslatorStore } from "@/lib/stores/translator-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

/**
 * Image intake for the translator (spec §23, §77).
 *
 * Accepts a file, a camera capture, or a synthetic sample.
 * The image is held in memory and sent only when the visitor
 * asks for a reading — nothing is uploaded on page load.
 */
export function ImageIntake() {
  const t = useTranslations("translate");
  const te = useTranslations("errors");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  const setImage = useTranslatorStore((state) => state.setImage);
  const imageDataUrl = useTranslatorStore((state) => state.imageDataUrl);

  const readFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      if (!ACCEPTED.includes(file.type)) {
        setError(te("unsupportedFormat"));
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(te("uploadTooLarge"));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        setError(te("uploadFailed"));
        return;
      };
      reader.onload = () => {
        const dataUrl = String(reader.result ?? "");
        const image = new Image();
        image.onload = () => {
          setImage(dataUrl, file.name, {
            width: image.naturalWidth || image.width,
            height: image.naturalHeight || image.height,
          });
          setError(null);
        };
        image.onerror = () => setError(te("uploadFailed"));
        image.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [setImage, te],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      readFile(event.dataTransfer.files?.[0]);
    },
    [readFile],
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-8 text-center",
          "transition-colors duration-200",
          dragging
            ? "border-gold bg-gold/5"
            : "border-ash bg-charcoal/50 hover:border-gold/40",
        )}
      >
        <ImageUp
          className="mx-auto h-8 w-8 text-sandstone/60"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm text-sandstone">{t("dropzone")}</p>
        <p className="mt-1.5 text-xs text-sandstone/60">
          {t("dropzoneHint")}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => fileInput.current?.click()}
            variant="primary"
            size="sm"
          >
            <Upload className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            {t("chooseFile")}
          </Button>
          <Button
            onClick={() => cameraInput.current?.click()}
            variant="outline"
            size="sm"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {t("useCamera")}
          </Button>
          {imageDataUrl ? (
            <Button
              onClick={() => setCropOpen(true)}
              variant="ghost"
              size="sm"
            >
              <Crop className="h-4 w-4" aria-hidden="true" />
              {t("cropTitle")}
            </Button>
          ) : null}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(event) => readFile(event.target.files?.[0])}
          aria-label={t("chooseFile")}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => readFile(event.target.files?.[0])}
          aria-label={t("useCamera")}
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <CropDialog open={cropOpen} onOpenChange={setCropOpen} />
    </div>
  );
}

/**
 * Crop step (spec §23).
 * A tighter crop materially improves recognition, so the
 * crop is applied to the image itself before analysis.
 */
function CropDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("translate");
  // "cancel" lives in `common`; this component previously asked
  // the `translate` namespace for it, so the crop dialog's cancel
  // button rendered the raw key.
  const tc = useTranslations("common");
  const imageDataUrl = useTranslatorStore((state) => state.imageDataUrl);
  const imageDimensions = useTranslatorStore(
    (state) => state.imageDimensions,
  );
  const setCrop = useTranslatorStore((state) => state.setCrop);
  const [region, setRegion] = useState({ x: 0.15, y: 0.3, width: 0.7, height: 0.4 });

  if (!imageDataUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("cropTitle")}</DialogTitle>
        <DialogDescription>{t("cropHint")}</DialogDescription>

        <div className="relative mt-5 overflow-hidden rounded-lg border border-ash bg-obsidian">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageDataUrl}
            alt=""
            className="block w-full"
            style={{
              aspectRatio: imageDimensions
                ? `${imageDimensions.width} / ${imageDimensions.height}`
                : "4 / 3",
            }}
          />
          <div
            className="pointer-events-none absolute border-2 border-gold bg-gold/10"
            style={{
              left: `${region.x * 100}%`,
              top: `${region.y * 100}%`,
              width: `${region.width * 100}%`,
              height: `${region.height * 100}%`,
            }}
          />
        </div>

        <div className="mt-5 space-y-3">
          {(
            [
              ["x", region.x],
              ["y", region.y],
              ["width", region.width],
              ["height", region.height],
            ] as const
          ).map(([key, value]) => (
            <label key={key} className="block">
              <span className="text-xs capitalize text-sandstone">
                {key}: {value.toFixed(2)}
              </span>
              <Input
                type="range"
                min={key === "width" || key === "height" ? 0.1 : 0}
                max={key === "x" || key === "y" ? 0.9 : 1}
                step={0.01}
                value={value}
                onChange={(event) =>
                  setRegion({ ...region, [key]: Number(event.target.value) })
                }
                className="h-8 border-0 bg-transparent p-0"
                aria-label={key}
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button
            onClick={() => {
              setCrop(region);
              onOpenChange(false);
            }}
          >
            {t("applyCrop")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Sample inscriptions (spec §62 demo content).
 *
 * The sample images are generated server-side from the sign
 * database and passed in as props, so what you see is exactly
 * what the reading pipeline will report.
 */
export function SamplePicker({
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

  return (
    <section aria-labelledby="samples-title" className="space-y-3">
      <div>
        <h2
          id="samples-title"
          className="font-display text-lg text-papyrus"
        >
          {t("useSample")}
        </h2>
        <p className="mt-1 text-xs text-sandstone/60">
          {t("sampleNote")}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {samples.map((sample) => (
          <li key={sample.id}>
            <SampleCard
              sample={sample}
              onSelect={() =>
                useTranslatorStore.getState().setImage(
                  sample.image,
                  `sample-${sample.id}.svg`,
                  { width: sample.width, height: sample.height },
                )
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SampleCard({
  sample,
  onSelect,
}: {
  sample: {
    id: string;
    label: string;
    image: string;
    glyphs: string;
  };
  onSelect: () => void;
}) {
  const t = useTranslations("translate");
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full overflow-hidden rounded-lg border border-ash",
        "bg-charcoal text-start transition-colors hover:border-gold/50",
        "focus-visible:outline-none",
      )}
    >
      <span className="relative block aspect-3/2 overflow-hidden bg-obsidian">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sample.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </span>
      <span className="flex items-center justify-between gap-2 p-3">
        <span className="min-w-0">
          <span className="block truncate text-sm text-papyrus">
            {sample.label}
          </span>
          <span className="hiero mt-1 block text-lg text-gold">
            {sample.glyphs}
          </span>
        </span>
        <Sparkles
          className="h-4 w-4 shrink-0 text-sandstone/40 group-hover:text-gold"
          aria-hidden="true"
        />
      </span>
      <span className="sr-only">{t("useSample")}</span>
    </button>
  );
}

/** Loading indicator used during analysis. */
export function AnalyzingPanel() {
  const t = useTranslations("translate");
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative overflow-hidden rounded-xl border border-gold/30 bg-charcoal p-10 text-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan-line bg-gradient-to-r from-transparent via-gold to-transparent"
      />
      <Loader2 className="mx-auto h-7 w-7 animate-spin text-gold" aria-hidden="true" />
      <p className="mt-4 font-display text-lg text-papyrus">
        {t("analyzing")}
      </p>
      <p className="mt-1.5 text-sm text-sandstone/70">
        {t("analyzingHint")}
      </p>
    </div>
  );
}

/** Reset control. */
export function ResetButton() {
  const t = useTranslations("translate");
  const reset = useTranslatorStore((state) => state.reset);
  return (
    <Button variant="ghost" size="sm" onClick={reset}>
      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
      {t("startOver")}
    </Button>
  );
}