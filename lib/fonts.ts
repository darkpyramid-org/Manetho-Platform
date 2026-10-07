import {
  IBM_Plex_Sans_Arabic,
  Inter,
  Marcellus,
  Noto_Naskh_Arabic,
  Noto_Sans_Egyptian_Hieroglyphs,
} from "next/font/google";

/**
 * Typography (spec §20).
 *
 * Five faces, each chosen for a reason rather than for
 * availability. All five are self-hosted by next/font: the
 * files are downloaded once at build time, served from our own
 * origin, and cached immutably. No request ever reaches
 * Google at runtime, which is both a privacy property and the
 * reason this is fast.
 *
 * Latin body — Inter. Humanist, engineered, and the only
 * category of interface font that stays legible at the 12–14px
 * this app uses most. Its tabular figures matter: Gardiner
 * codes and Unicode values are set in it and must align in
 * columns.
 *
 * Latin display — Marcellus. A Trajan revival. Trajan is the
 * right reference rather than an "Egyptian" display face,
 * because monumental Roman inscriptional capitals — even
 * spacing, no lowercase fussiness, strokes cut with a chisel —
 * are the closest typographic cousin to how hieroglyphs were
 * actually carved into stone. This app is a museum interface,
 * not a novelty, and Marcellus reads as authority instead of
 * theme-park.
 *
 * Arabic body — IBM Plex Sans Arabic. Chosen to pair with
 * Inter: same humanist skeleton, same engineered spacing
 * logic, so the two scripts sit together without one looking
 * borrowed. It also handles harakat and the full diacritic
 * set properly, which a default system Arabic face often does
 * not.
 *
 * Arabic display — Noto Naskh Arabic. Naskh is the calligraphic
 * tradition that carries the same cultural weight for Arabic
 * that Trajan carries for Latin. Heading both scripts with the
 * same *kind* of face is what makes a bilingual layout feel
 * designed rather than translated. Using a UI sans for Arabic
 * display while Latin display is inscriptional is the single
 * most common bilingual-typography mistake.
 *
 * Hieroglyphs — Noto Sans Egyptian Hieroglyphs. This one is a
 * correctness fix, not a taste call. The sign database is
 * Unicode Egyptian Hieroglyphs, so rendering it depends on the
 * visitor happening to have a font covering U+13000–U+1342F.
 * Most do not. Without a shipped face, signs render as tofu
 * boxes — and an AI heritage product showing tofu boxes for
 * every hieroglyph is not shippable. Only the egyptian-hieroglyphs
 * subset is requested.
 *
 * Preloading is deliberate. Inter and Marcellus are on the
 * critical path of every page and are small enough to justify it.
 * The hieroglyph face is not preloaded despite the logo glyph
 * being above the fold, because at 263 KB it would dominate the
 * critical path of every route to serve one glyph. The Arabic
 * faces are not preloaded either: the class that defines them is
 * only applied on Arabic routes, so English pages never
 * reference — and therefore never download — them.
 */

/** Latin body. Variable weight 100–900 for one file, not nine. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--mf-sans",
  preload: true,
  // Generates a metric-matched fallback face, which is what
  // keeps the swap from shifting layout.
  adjustFontFallback: true,
});

/** Latin display. Inscriptional Roman capitals. */
export const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--mf-display",
  preload: true,
  fallback: ["Iowan Old Style", "Palatino Linotype", "Georgia", "serif"],
});

/** Arabic body. Humanist, engineered to pair with Inter. */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--mf-ar-sans",
  // Applied only on Arabic routes; see applyFontVariables().
  preload: false,
});

/** Arabic display. Naskh — the inscriptional tradition. */
export const naskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--mf-ar-display",
  preload: false,
});

/**
 * Egyptian Hieroglyphs. Correctness, not decoration.
 *
 * Not preloaded, and that is a deliberate trade. The file is
 * 263 KB — by some distance the largest asset the app ships —
 * because the Egyptian Hieroglyphs block has over a thousand
 * complex outlines. Preloading it put it on the critical path of
 * every page, including the admin and learning routes, to serve a
 * single glyph in the header logo.
 *
 * With display: "swap" the page paints immediately in the
 * fallback and the glyphs arrive a moment later. A logo that
 * settles slightly late is far cheaper than first paint blocked
 * on 263 KB of font data, and on a warm cache the difference is
 * invisible.
 */
export const hieroglyphs = Noto_Sans_Egyptian_Hieroglyphs({
  subsets: ["egyptian-hieroglyphs"],
  weight: "400",
  display: "swap",
  variable: "--mf-hiero",
  preload: false,
});

/**
 * Class list for <html>.
 *
 * The Arabic faces are only requested when the locale is
 * Arabic. A font is downloaded when some rendered element
 * actually matches it, so leaving the variables undefined on
 * English routes means the Arabic files are never fetched —
 * without giving up correct typography on Arabic routes.
 */
export function fontVariables(locale: string): string {
  const classes = [
    inter.variable,
    marcellus.variable,
    hieroglyphs.variable,
  ];
  if (locale === "ar") {
    classes.push(plexArabic.variable, naskhArabic.variable);
  }
  return classes.filter(Boolean).join(" ");
}