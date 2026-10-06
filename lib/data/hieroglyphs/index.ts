import type { HieroglyphSign } from "@/types/hieroglyph";
import type { SignRecord } from "./uniliteral";
import { uniliteralRecords } from "./uniliteral";
import { biliteralRecordsA } from "./biliteral-a";
import { ideogramRecords } from "./ideograms";
import { GARDINER, UNICODE } from "../sources";

/**
 * Manetho hieroglyph knowledge database (spec §20).
 *
 * Gardiner codes, Unicode code points and phonetic values
 * are sourced from the Unicode Egyptian Hieroglyphs block
 * (U+13000–U+1342F), which encodes Alan Gardiner's sign
 * list, and from standard Egyptological transliteration
 * conventions (Gardiner 1957; Allen 2000).
 *
 * This is the development dataset. Production deployments
 * augment it with the institutional knowledge base.
 */

const SIGN_SOURCES = [GARDINER, UNICODE];

/** Expand a compact sign record into a full HieroglyphSign. */
function expand(record: SignRecord): HieroglyphSign {
  const [
    gardinerCode,
    unicodeHex,
    glyph,
    name,
    category,
    signType,
    phoneticValues,
    ideographicMeaning,
    determinativeMeaning,
    description,
    era,
    mdc,
    variants,
  ] = record;

  // The glyph is derived from the declared code point rather
  // than trusted verbatim. Some sign shapes live in the
  // Extended-A range (U+13460–U+143FA) for modern
  // Aegyptological forms; rendering those here would place
  // the sign outside the block its own Unicode value claims,
  // so the code point is authoritative.
  const codePoint = Number.parseInt(unicodeHex, 16);
  const resolvedGlyph =
    Number.isFinite(codePoint) &&
    codePoint >= 0x13000 &&
    codePoint <= 0x1342f
      ? String.fromCodePoint(codePoint)
      : glyph;

  return {
    id: `hiero-${gardinerCode.toLowerCase()}`,
    gardinerCode,
    unicode: `U+${unicodeHex.toUpperCase()}`,
    glyph: resolvedGlyph,
    name,
    description,
    category,
    phoneticValues,
    ideographicMeaning,
    determinativeMeaning,
    signType,
    mdc,
    variants: variants ?? [],
    era: era ?? "Middle Egyptian",
    sources: SIGN_SOURCES,
  };
}

const allRecords: SignRecord[] = [
  ...uniliteralRecords,
  ...biliteralRecordsA,
  ...ideogramRecords,
];

/** The full sign database, deduplicated by Gardiner code. */
export const hieroglyphSigns: HieroglyphSign[] = (() => {
  const seen = new Set<string>();
  const out: HieroglyphSign[] = [];
  for (const record of allRecords) {
    if (seen.has(record[0])) continue;
    seen.add(record[0]);
    out.push(expand(record));
  }
  return out;
})();

const byGardiner = new Map(
  hieroglyphSigns.map((s) => [s.gardinerCode.toUpperCase(), s]),
);
const byUnicode = new Map(
  hieroglyphSigns.map((s) => [s.unicode.toUpperCase(), s]),
);
const byGlyph = new Map(hieroglyphSigns.map((s) => [s.glyph, s]));

/**
 * Find a sign by Gardiner code, case-insensitively.
 * The "Aa" group is why this cannot simply compare strings:
 * "Aa001".toUpperCase() is "AA001", which matches nothing.
 */
export function findSignByGardiner(code: string): HieroglyphSign | undefined {
  return byGardiner.get(code.trim().toUpperCase());
}

export function findSignByUnicode(unicode: string): HieroglyphSign | undefined {
  return byUnicode.get(unicode.trim().toUpperCase());
}

export function findSignByGlyph(glyph: string): HieroglyphSign | undefined {
  return byGlyph.get(glyph);
}

export function searchSigns(query: string): HieroglyphSign[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return hieroglyphSigns.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.gardinerCode.toLowerCase().includes(q) ||
      s.unicode.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.ideographicMeaning ?? "").toLowerCase().includes(q) ||
      s.phoneticValues.some((p) => p.toLowerCase().includes(q)),
  );
}

/** The 24 uniliteral phonemes, in conventional order. */
export const uniliterals: HieroglyphSign[] = hieroglyphSigns.filter(
  (s) => s.signType === "uniliteral",
);
