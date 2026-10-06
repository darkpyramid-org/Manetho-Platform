/* eslint-disable no-restricted-globals */
/**
 * Manetho service worker (spec §73).
 *
 * Offline-first for reading content: navigations and static
 * assets are cached, so museum labels, lessons and the sign
 * database stay readable without a connection.
 *
 * AI requests are deliberately NEVER cached or queued:
 * a stale "recognition result" presented as a live reading
 * would violate the product's core promise (spec §77). The
 * app tells the user plainly when AI needs a connection.
 */

const VERSION = "manetho-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;

const PRECACHE_URLS = [
  "/",
  "/translator",
  "/discover",
  "/museums",
  "/learn",
  "/assistant",
  "/manifest.webmanifest",
  "/icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {
        // A failed precache must not block installation.
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Never cache or serve stale AI output. */
function isAiRequest(url) {
  return (
    url.pathname.startsWith("/api/ai/") ||
    url.pathname === "/api/search"
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Same-origin only.
  if (url.origin !== self.location.origin) return;

  if (isAiRequest(url)) {
    // Let the request fail honestly when offline — the UI
    // reports that AI requires a connection.
    return;
  }

  // Navigations: network first, cache fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const home = await caches.match("/");
          if (home) return home;
          return new Response(
            "<!doctype html><meta charset=\"utf-8\"><title>Offline</title><p>Manetho is offline. Reconnect to use AI features.</p>",
            { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 },
          );
        }),
    );
    return;
  }

  // Static assets: cache first, then network.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});