"use client";

import { create } from "zustand";
import type {
  SignDetection,
  TranslationResult,
} from "@/types/hieroglyph";

/**
 * Translator state (spec §20).
 *
 * Image data stays in memory only — it is never persisted
 * and never leaves the device except through the explicit
 * translate action (spec §28, privacy).
 */
export type TranslatorStatus =
  | "idle"
  | "ready"
  | "analyzing"
  | "done"
  | "error";

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Adjustments {
  rotation: number;
  brightness: number;
  contrast: number;
  grayscale: boolean;
}

interface TranslatorState {
  status: TranslatorStatus;
  imageDataUrl: string | null;
  imageFileName: string | null;
  imageDimensions: { width: number; height: number } | null;
  crop: CropRegion | null;
  adjustments: Adjustments;
  result: TranslationResult | null;
  error: string | null;
  /** Manually chosen signs (spec §20 fallback path). */
  manualSigns: string[];
  activeDetectionId: string | null;

  setImage: (
    dataUrl: string,
    fileName: string,
    dimensions: { width: number; height: number },
  ) => void;
  setCrop: (crop: CropRegion | null) => void;
  setAdjustments: (patch: Partial<Adjustments>) => void;
  resetAdjustments: () => void;
  setResult: (result: TranslationResult) => void;
  setError: (message: string | null) => void;
  addManualSign: (gardinerCode: string) => void;
  removeManualSign: (gardinerCode: string) => void;
  clearManualSigns: () => void;
  setActiveDetection: (id: string | null) => void;
  reset: () => void;
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  rotation: 0,
  brightness: 100,
  contrast: 100,
  grayscale: false,
};

export const useTranslatorStore = create<TranslatorState>((set) => ({
  status: "idle",
  imageDataUrl: null,
  imageFileName: null,
  imageDimensions: null,
  crop: null,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  result: null,
  error: null,
  manualSigns: [],
  activeDetectionId: null,

  setImage: (dataUrl, fileName, dimensions) =>
    set({
      status: "ready",
      imageDataUrl: dataUrl,
      imageFileName: fileName,
      imageDimensions: dimensions,
      crop: null,
      result: null,
      error: null,
      activeDetectionId: null,
    }),

  setCrop: (crop) => set({ crop }),
  setAdjustments: (patch) =>
    set((state) => ({
      adjustments: { ...state.adjustments, ...patch },
    })),
  resetAdjustments: () => set({ adjustments: { ...DEFAULT_ADJUSTMENTS } }),

  setResult: (result) =>
    set({
      result,
      status: "done",
      error: null,
      activeDetectionId: result.detections[0]?.id ?? null,
    }),

  setError: (message) =>
    set({ status: "error", error: message }),

  addManualSign: (gardinerCode) =>
    set((state) =>
      state.manualSigns.includes(gardinerCode)
        ? state
        : { manualSigns: [...state.manualSigns, gardinerCode] },
    ),

  removeManualSign: (gardinerCode) =>
    set((state) => ({
      manualSigns: state.manualSigns.filter(
        (code) => code !== gardinerCode,
      ),
    })),

  clearManualSigns: () => set({ manualSigns: [] }),

  setActiveDetection: (id) => set({ activeDetectionId: id }),

  reset: () =>
    set({
      status: "idle",
      imageDataUrl: null,
      imageFileName: null,
      imageDimensions: null,
      crop: null,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      result: null,
      error: null,
      manualSigns: [],
      activeDetectionId: null,
    }),
}));

/** Selectors — stable references for rendering. */
export const selectDetections = (
  state: TranslatorState,
): SignDetection[] => state.result?.detections ?? [];

export const selectIsAnalyzing = (state: TranslatorState) =>
  state.status === "analyzing";