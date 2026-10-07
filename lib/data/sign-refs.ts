import { hieroglyphRepository } from "@/lib/data";
import type { SignRef } from "@/types/hieroglyph";

/**
 * Server-side sign resolution.
 *
 * Client components must not import the sign repository directly:
 * doing so pulls the whole 146 KB dataset into the browser bundle
 * to render a dozen glyphs. Instead a server component resolves
 * what it needs and passes a SignRef[] down as props, which is
 * also cheaper because the props are part of the statically
 * generated page rather than shipped as a separate chunk.
 *
 * This module is therefore server-only in practice. Nothing here
 * imports React, but importing it from a "use client" file would
 * undo the whole point.
 */

/** Reduce a full sign to the fields a client component renders. */
function toRef(code: string): SignRef | null {
  const sign = hieroglyphRepository.get(code);
  if (!sign) return null;
  return {
    gardinerCode: sign.gardinerCode,
    glyph: sign.glyph,
    name: sign.name,
    phoneticValues: sign.phoneticValues,
    ideographicMeaning: sign.ideographicMeaning,
  };
}

/**
 * Resolve Gardiner codes to refs, dropping any that do not exist.
 *
 * Dropping rather than throwing is deliberate: a lesson that
 * references a missing sign should render the rest of the lesson
 * rather than fail the page. The admin lessons view reports the
 * gap separately.
 */
export function signRefs(codes: readonly (string | undefined)[]): SignRef[] {
  return codes
    .filter((code): code is string => Boolean(code))
    .map(toRef)
    .filter((sign): sign is SignRef => sign !== null);
}

/** Keyed by Gardiner code, for components that look signs up. */
export function signRefMap(
  codes: readonly (string | undefined)[],
): Record<string, SignRef> {
  const map: Record<string, SignRef> = {};
  for (const ref of signRefs(codes)) {
    map[ref.gardinerCode] = ref;
  }
  return map;
}

/**
 * The manual sign palette offered when a reading is too uncertain
 * to trust (spec §20).
 *
 * The uniliterals plus the most recognisable triliterals: the ankh
 * and the god standard, because they are what a curious visitor
 * will reach for first.
 */
export const MANUAL_SIGN_PALETTE: readonly string[] = [
  "G001", "D021", "G017", "N035", "X001", "D046", "R008", "S034",
  "O001", "F035", "L001", "G005", "R011", "D010", "V010", "Y003",
] as const;

/** The palette, resolved. Sixteen signs, not two hundred and seventy-four. */
export function manualSignPalette(): SignRef[] {
  return signRefs(MANUAL_SIGN_PALETTE);
}