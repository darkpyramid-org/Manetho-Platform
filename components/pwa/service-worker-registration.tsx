"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (spec §73).
 *
 * Only runs in production — a service worker in development
 * serves stale bundles and makes hot reload confusing.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error: unknown) => {
          // Registration failure must not break the app —
          // it only means offline support is unavailable.
          console.warn("[manetho] service worker registration failed", error);
        });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}