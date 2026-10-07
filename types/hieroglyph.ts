import type { BoundingBox, ConfidenceLevel, Source } from "./common";

/**
 * Hieroglyphic sign (spec §20).
 * Data sourced from the Unicode Egyptian Hieroglyphs block
 * (U+13000–U+1342F), which encodes Gardiner's sign list.
 */
export interface HieroglyphSign {
  id: string;
  /** Gardiner code, e.g. "G017" */
  gardinerCode: string;
  /** Unicode code point, e.g. "U+13153" */
  unicode: string;
  /** The sign glyph itself, e.g. "𓅓" */
  glyph: string;
  name: string;
  description: string;
  /** Gardiner category letter: "A" | "B" | ... | "Aa" */
  category: HieroglyphCategory;
  /** Phonetic value(s), e.g. ["m"] — empty for pure ideograms/determinatives */
  phoneticValues: string[];
  /** Ideographic meaning (logogram value), e.g. "owl" */
  ideographicMeaning?: string;
  /** Determinative usage */
  determinativeMeaning?: string;
  /** Sign type */
  signType: "uniliteral" | "biliteral" | "triliteral" | "ideogram" | "determinative" | "classifier" | "other";
  /** MdC transliteration notation, e.g. "m" or "H" */
  mdc?: string;
  variants: string[];
  era: string;
  sources: Source[];
}

export type HieroglyphCategory =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "K" | "L"
  | "M" | "N" | "NL" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V"
  | "W" | "X" | "Y" | "Z" | "Aa";

/**
 * The subset of a sign that client components need in order to
 * render it.
 *
 * This exists because a full HieroglyphSign is ~500 bytes of
 * description, provenance and variant data, and the whole
 * database is 146 KB. A client component that imported the
 * repository to look up a handful of signs shipped all of it to
 * every visitor — 95 KB of JavaScript on the translator, the
 * scanner and the lesson reader.
 *
 * Server components resolve signs and pass these instead, so the
 * dataset stays on the server. Discovery genuinely needs all 274
 * signs to filter them instantly, and it is the one place the
 * full data is correct to ship.
 */
export interface SignRef {
  gardinerCode: string;
  glyph: string;
  name: string;
  phoneticValues: string[];
  ideographicMeaning?: string;
}

export const hieroglyphCategoryLabels: Record<HieroglyphCategory, string> = {
  A: "A — Man and his occupations",
  B: "B — Woman and her occupations",
  C: "C — Anthropomorphic deities",
  D: "D — Parts of the human body",
  E: "E — Mammals",
  F: "F — Parts of mammals",
  G: "G — Birds",
  H: "H — Parts of birds",
  I: "I — Amphibians, reptiles, etc.",
  K: "K — Fish and parts of fish",
  L: "L — Invertebrates and lesser animals",
  M: "M — Trees and plants",
  N: "N — Sky, earth, water",
  NL: "NL — Nomes of Lower Egypt",
  O: "O — Buildings and parts of buildings",
  P: "P — Ships and parts of ships",
  Q: "Q — Domestic and funerary furniture",
  R: "R — Temple furniture and sacred emblems",
  S: "S — Crowns, dress, staves, etc.",
  T: "T — Warfare, hunting, butchery",
  U: "U — Agriculture, crafts, professions",
  V: "V — Rope, fiber, baskets, bags, etc.",
  W: "W — Vessels of stone and earthenware",
  X: "X — Loaves and cakes",
  Y: "Y — Writings, games, music",
  Z: "Z — Strokes, signs derived from hieratic, geometrical figures",
  Aa: "Aa — Unclassified signs",
};

/** One detected sign inside a translation result (spec §22). */
export interface SignDetection {
  id: string;
  boundingBox: BoundingBox;
  gardinerCode: string;
  unicode: string;
  glyph: string;
  name: string;
  transliteration: string;
  phoneticValues: string[];
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  signType: HieroglyphSign["signType"];
  ideographicMeaning?: string;
}

export interface AlternativeReading {
  transliteration: string;
  translation: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  explanation: string;
}

export interface TranslationResult {
  requestId: string;
  imageId: string;
  status: "completed" | "failed" | "low_confidence";
  detections: SignDetection[];
  transliteration: string;
  translation: string;
  alternatives: AlternativeReading[];
  explanation: string;
  context: {
    historicalPeriod?: string;
    possibleMeaning?: string;
    grammar?: string;
    culturalSignificance?: string;
    references?: string;
  };
  overallConfidence: number;
  overallConfidenceLevel: ConfidenceLevel;
  sources: Source[];
  /** True when produced by the deterministic demo provider. */
  isDemo: boolean;
  createdAt: string;
}
