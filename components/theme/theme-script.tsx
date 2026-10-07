import Script from "next/script";
import { THEME_SCRIPT } from "@/lib/theme";

/**
 * Applies the stored or system theme before first paint.
 *
 * Placed as the first child of <body>. Next.js does hoist
 * beforeInteractive scripts into the head during App Router
 * SSR, but placing it first in <body> gets the same guarantee
 * for a clearer reason: the script is inline, synchronous, and
 * parsed before any body content, so it runs before the first
 * paintable pixel is laid out. There is nothing above it that
 * could paint — the head holds no visible content — so there is
 * no window in which the wrong theme reaches the screen.
 *
 * A useEffect would be the obvious alternative and is the one
 * that does not work: it runs after the first paint, which is
 * precisely the flash of the wrong theme that this exists to
 * prevent.
 */
export function ThemeScript() {
  return (
    <Script id="manetho-theme" strategy="beforeInteractive">
      {THEME_SCRIPT}
    </Script>
  );
}