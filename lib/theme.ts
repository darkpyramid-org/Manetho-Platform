/**
 * Theme tokens (spec §18).
 *
 * Two themes, both first-class. Manetho's identity is the
 * obsidian-and-gold night gallery, but a night-only interface
 * excludes people: reading a page of text in a bright gallery
 * or outdoors is a real context, and an app about studying
 * inscriptions invites long sessions.
 *
 * The light theme is not an inversion. It is a warm daylight
 * palette — limestone and buff paper rather than a grey
 * inversion — because a grey inverted dark theme reads as a
 * bug rather than a choice.
 */

export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

/** localStorage key. Namespaced so it cannot collide on a shared origin. */
export const THEME_STORAGE_KEY = "manetho.theme";

/** Attribute the theme is written to on <html>. */
export const THEME_ATTRIBUTE = "data-theme";

/**
 * Runs before first paint, so the correct theme is on <html>
 * before a single pixel is drawn.
 *
 * Three things it has to get right:
 *
 * 1. No flash. If this ran in an effect, the page would paint
 *    in the default theme and then repaint — the exact flash
 *    this script exists to prevent.
 * 2. System preference is the default, but an explicit choice
 *    wins forever. Once someone picks light, a later change to
 *    their OS theme must not override that.
 * 3. It keeps listening to the system only while no explicit
 *    choice exists, so following the system is live rather than
 *    a one-time snapshot at first visit.
 *
 * Kept as a string because it is inlined verbatim into the
 * document. Everything here is ES5, minified by hand, and
 * wrapped in try/catch: a theme failure must never break the
 * page. Private-browsing Safari throws on localStorage access.
 */
export const THEME_SCRIPT = `(function(){try{` +
  `var k=${JSON.stringify(THEME_STORAGE_KEY)},` +
  `a=${JSON.stringify(THEME_ATTRIBUTE)},` +
  `r=document.documentElement,` +
  `m=window.matchMedia('(prefers-color-scheme: light)'),` +
  `s=null;` +
  `try{s=localStorage.getItem(k)}catch(e){}` +
  `var t=(s==='light'||s==='dark')?s:(m.matches?'light':'dark');` +
  `r.setAttribute(a,t);r.style.colorScheme=t;` +
  `if(m.addEventListener){m.addEventListener('change',function(e){` +
  `try{if(localStorage.getItem(k))return}catch(x){}` +
  `var n=e.matches?'light':'dark';` +
  `r.setAttribute(a,n);r.style.colorScheme=n;` +
  `})}else if(m.addListener){m.addListener(function(e){` +
  `var n=e.matches?'light':'dark';` +
  `r.setAttribute(a,n);r.style.colorScheme=n;` +
  `})}}catch(e){}})();`;

/** True when the visitor asked the OS to reduce motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * View Transitions support (spec §63, graceful degradation).
 *
 * Where available the theme change becomes a single circular
 * wipe that starts under the toggle the visitor pressed, which
 * communicates cause and effect instead of the whole page
 * snapping. Where it is not, the caller falls back to a plain
 * crossfade. The feature is detected, never assumed: Safari
 * shipped it late and Firefox has only recently.
 */
export function supportsViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as { startViewTransition?: unknown })
      .startViewTransition === "function"
  );
}

/** View Transitions animates the whole document; opt out of the UA's fade. */
export function prefersCrossDocumentTransition(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as { startViewTransition?: unknown })
      .startViewTransition === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}