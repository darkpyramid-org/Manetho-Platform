"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  prefersReducedMotion,
  supportsViewTransitions,
  type Theme,
} from "@/lib/theme";

/**
 * Theme toggle (spec §18).
 *
 * The animation is deliberately two-tiered, because a single
 * technique cannot be both modern and universal:
 *
 * 1. Where the View Transitions API exists, the switch is a
 *    circular wipe that expands from this button. It is the
 *    only way to animate an entire page's colours as one
 *    composited layer — animating a hundred elements
 *    individually is what makes most theme toggles feel slow.
 * 2. Everywhere else, a short global crossfade on the colour
 *    properties. It is applied for the length of the change and
 *    then removed, so the app never carries transition overhead
 *    during normal interaction.
 *
 * prefers-reduced-motion is honoured in both tiers: the switch
 * then becomes an instant repaint with no wipe and no crossfade.
 */
export function ThemeToggle() {
  const t = useTranslations("common");
  const [theme, setTheme] = useState<Theme>("dark");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const activeTransition = useRef<ViewTransition | null>(null);

  // The inline script already set the correct theme on <html>
  // before paint; this only syncs React state to it, so the
  // control can never disagree with what is on screen.
  useEffect(() => {
    const current = document.documentElement.getAttribute(THEME_ATTRIBUTE);
    if (current === "light" || current === "dark") setTheme(current);
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    // The attribute is written synchronously, before React is
    // told anything. Every visual in this component — page
    // colours and the toggle's own thumb and icons — resolves
    // from that one attribute, so the DOM is already correct at
    // the moment a view transition snapshots it.
    const root = document.documentElement;
    root.setAttribute(THEME_ATTRIBUTE, next);
    root.style.colorScheme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing can refuse storage. The theme still
      // applies for this page view, which is the important part.
    }
    // React state carries only the accessible label now. It may
    // land a frame later, which is invisible: nothing visual
    // depends on it.
    setTheme(next);
  }, []);

  /** The tier-2 path: a plain crossfade, attached only for its duration. */
  const crossfade = useCallback(
    (next: Theme) => {
      const root = document.documentElement;
      root.classList.add("theme-crossfade");
      applyTheme(next);
      window.setTimeout(() => {
        root.classList.remove("theme-crossfade");
      }, 380);
    },
    [applyTheme],
  );

  const handleClick = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;

    if (prefersReducedMotion()) {
      applyTheme(next);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();

    if (supportsViewTransitions() && rect) {
      // Hand the wipe its origin and radius: the centre of this
      // button, and the distance to the furthest corner, so the
      // circle covers the viewport exactly as it lands.
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      root.style.setProperty("--vt-x", `${x}px`);
      root.style.setProperty("--vt-y", `${y}px`);
      root.style.setProperty("--vt-r", `${radius}px`);

      // Two clicks in quick succession would otherwise queue two
      // full-page snapshots and fight over the timeline. Skip the
      // one already in flight and let this one own the screen.
      activeTransition.current?.skipTransition();

      let transition: ViewTransition;
      try {
        transition = document.startViewTransition(() => applyTheme(next));
      } catch {
        // startViewTransition throws rather than returning a
        // rejected transition in some conditions. A theme toggle
        // must never become a dead control, so fall through to
        // the plain crossfade instead.
        activeTransition.current = null;
        crossfade(next);
        return;
      }
      activeTransition.current = transition;

      // Both promises have to be handled. A transition that is
      // skipped or refused settles as rejected, and an unhandled
      // rejection there would surface as a console error on every
      // fast double-click.
      void transition.finished
        .catch(() => undefined)
        .finally(() => {
          if (activeTransition.current === transition) {
            activeTransition.current = null;
          }
          root.style.removeProperty("--vt-x");
          root.style.removeProperty("--vt-y");
          root.style.removeProperty("--vt-r");
        });
      return;
    }

    crossfade(next);
  }, [applyTheme, crossfade, theme]);

  const isDark = theme === "dark";

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      aria-pressed={isDark}
      aria-label={t(isDark ? "themeToLight" : "themeToDark")}
      title={t(isDark ? "themeToLight" : "themeToDark")}
      data-theme-toggle
      className="theme-toggle"
    >
      <span aria-hidden="true" className="theme-toggle__thumb">
        <Sun className="theme-toggle__icon theme-toggle__icon--sun" />
        <Moon className="theme-toggle__icon theme-toggle__icon--moon" />
      </span>
    </button>
  );
}