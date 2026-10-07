# Manetho — architecture

This document explains how the system is put together and why.
For setup and features, see [README.md](./README.md).

## 1. Layering

```
Browser
  └─ React components (presentation + interaction only)
       └─ fetch → typed API routes (app/api/**)
            └─ services (business rules, validation)
                 ├─ repositories (data access)
                 └─ AI gateway (provider selection + pipeline)
                      └─ providers (OpenAI / Huawei / Local / Mock)
```

The rule that keeps this honest: **business logic never lives in a
React component.** A component collects input, calls an endpoint
and renders what comes back. If you find yourself writing a rule
inside a `.tsx` file, it belongs one layer down.

### Why API-first

The web app is one client of the platform. Every capability is a
typed HTTP route, so a native app, a kiosk, or an institutional
integration gets exactly the same behaviour — including the same
error envelope and the same validation. Nothing is only possible
from the browser.

### Error envelope

Every route returns data, or:

```json
{ "error": { "code": "AI_OUTPUT_ERROR", "message": "…", "requestId": "req_…" } }
```

`lib/api/responses.ts` owns this. Clients never have to guess a
shape. Provider errors carry a stable prefix
(`AI_PROVIDER_ERROR: …`) that `apiErrorFromException` maps to an
HTTP status — 503 for "not configured", 502 for "provider failed",
422 for validation — while the internal detail stays in the logs.

## 2. AI layer

### The gateway

`lib/ai/gateway.ts` is the only entry point for AI work. It:

1. selects a provider bundle from `AI_PROVIDER`;
2. runs the pipeline;
3. validates the result with Zod;
4. returns the domain type, or throws.

Components never import a provider.

### The pipeline

`translateInscription` runs vision → OCR → translation:

```
image ──▶ vision.inspect()   locate inscription, detect signs
      ──▶ ocr.recognize()    refine each sign against candidates
      ──▶ translation.translate()  transliterate + interpret
      ──▶ normalise + Zod validate  ──▶ TranslationResult
```

The OCR pass is a refinement. If it throws, the vision result
stands — a degraded reading beats no reading, as long as the
degradation is visible in the per-sign confidences.

### Validation is not optional

`lib/ai/schemas.ts` defines the contract. If the model returns
something that fails validation, the gateway throws
`AI_OUTPUT_ERROR` and the API returns an error. There is no
partial-answer path, no "best effort" coercion, and no default
that fills in a missing field. This is the mechanism behind the
no-fabrication principle: a wrong shape is rejected, not
displayed.

### Providers

Seven interfaces — `VisionProvider`, `OCRProvider`,
`TranslationProvider`, `LLMProvider`, `EmbeddingProvider`,
`STTProvider`, `TTSProvider` — in `lib/ai/types.ts`.

| Provider | Module | Notes |
| --- | --- | --- |
| OpenAI | `providers/openai.ts` | REST via `fetch`, no vendor SDK. JSON mode + Zod |
| Huawei Cloud | `providers/huawei.ts` | ModelArts' OpenAI-compatible endpoint |
| Local | `providers/local.ts` | Ollama-compatible; nothing leaves the machine |
| Mock | `providers/mock-vision.ts`, `mock-llm.ts` | Deterministic; the default |

OpenAI, Huawei and Local share the same structure but are separate
modules: a provider that needs its own auth, endpoint or error
handling should not have to fight a shared abstraction.

### STT and TTS fail loudly

The Mock `STTProvider` and `TTSProvider` throw
`AI_NOT_CONFIGURED`. They do not return fake audio or a fabricated
transcript. Voice in development uses the browser's Web Speech API,
which is a real implementation, so there is nothing to simulate.

### The Mock provider is deterministic

Fixtures are seeded from an FNV-1a hash of the input, and
`mulberry32` provides the randomness. The same image always
yields the same result, which makes tests stable and lets a user
reproduce a demo. Twenty-two curated inscription samples carry real
philology — genuine readings from Gardiner and Allen — not invented
text.

Synthetic sample images embed a `data-signs` attribute naming the
Gardiner codes they draw, so a sample and its reading always agree.
This is a demo affordance and is documented as such: a photograph
has no such attribute, so the provider falls back to hashing. It
is not pretending to do OCR.

### Prompts

`prompts/*.md` holds the prompts used by the real providers:
`assistant-system.md`, `vision-detection.md`, `translation.md`.
They are documents rather than code constants so they can be
reviewed and versioned by people who write about Egyptology.

## 3. Data layer

`lib/data` is the content layer. `lib/data/index.ts` exposes the
data through five interfaces — `MuseumRepository`,
`ArtifactRepository`, `HieroglyphRepository`, `LearningRepository`,
`TourRepository` — which the curated dataset implements. Pages read
through those interfaces rather than reaching into individual
files, so the shape of the data is stated once.

### Reads and writes diverge on purpose

`DATABASE_URL` decides the **write** path. Content reads always
come from the curated dataset, and that is deliberate:

- Museums, artifacts, signs, lessons and tours are reference
  material that changes on a review cycle, not per request. They
  are statically generated at build time, which makes them fast,
  CDN-cacheable, and available offline — and means a build never
  depends on the production database being reachable.
- Every inscription reading is written to PostgreSQL with its
  per-sign confidence. That is what makes the admin review queue
  real rather than a mock-up, and what allows readings to be
  compared between providers later.

`/api/health` reports whether the database is reachable and the
stored row counts, so a deployment's state is observable without
guessing.

There is deliberately **no** Prisma-backed read path. An earlier
version had one; it was removed because nothing used it, and
having unused code that the architecture document described as
active is worse than not having it. If database-backed content
editing is ever needed, that repository belongs with the admin
CRUD that requires it — not ahead of it.

### Persistence is best-effort, deliberately

`lib/server/translations.ts` writes the reading after the visitor
has already received it. If the database is unavailable, the write
is logged and the reading is still returned. A database outage
must not deny a visitor a result the pipeline computed
successfully. The failure is visible in the logs rather than in
the visitor's face.

### Hieroglyph integrity

The database is the product's foundation, so it is treated as
data to be verified rather than prose to be trusted:

- Gardiner codes, Unicode values and phonetic values come from the
  Unicode Egyptian Hieroglyphs block (U+13000–U+1342F), which
  encodes Gardiner's sign list.
- **The glyph is rendered from its declared code point**, not
  stored verbatim. Two signs had drifted into the Extended-A range
  (U+13460–U+143FA, modern Aegyptological forms); deriving the
  glyph makes that class of drift impossible.
- Lookup is case-insensitive through an upper-cased index rather
  than by upper-casing the query. This matters for the `Aa`
  group: `"Aa001".toUpperCase()` is `"AA001"`, which matches
  nothing — a bug that had made all 32 `Aa` signs unreachable.
- `tests/unit/hieroglyphs.test.ts` asserts the invariants,
  including all 24 uniliterals individually.

### Floor plans use their own coordinate space

Rooms and objects live in a 0–1000 plan space, deliberately
decoupled from latitude and longitude. The same stored data can be
rendered as SVG (as it is today), exported as GeoJSON for indoor
positioning, or mapped to BLE/UWB beacons later, without a
migration. A test asserts every artifact's computed position falls
inside the rectangle of the room that contains it.

### Images are generated

Museum covers, artifact thumbnails and sample inscriptions are
deterministic SVG data URIs built from the design palette. The
project has no binary image assets and no external CDN dependency,
and every image is reproducible from its seed.

## 4. Frontend

### Server components first

Pages are server components. The data layer is pure and
browser-safe, so a client component can import it directly for
instant filtering — which is how `discover` searches 274 signs and
20 objects with no request round-trip.

Interactive islands are marked `"use client"`: the translator, the
assistant, the floor plan, discovery, the lesson reader.

### State

Two Zustand stores, one per feature (`translator-store`,
`assistant-store`). They hold transient UI state only. Images stay
in memory and are never persisted — a photograph of an inscription
is the user's, and it does not leave the device except through the
explicit translate action.

### Rendering

Tailwind v4 with a CSS-first config: the design tokens live in
`app/[locale]/globals.css` under `@theme`, not in a
`tailwind.config.js`. Obsidian and charcoal surfaces, sandstone
text, ancient gold accents, papyrus highlights.

### Client bundle budget

The rule is that **server data stays on the server**, and it is a
rule with teeth, because the obvious way to write these components
breaks it silently.

The translator and the lesson reader both needed to look up a
handful of signs. Both did it by importing `hieroglyphRepository`
into a `"use client"` file, which shipped the entire 274-sign
database — 242 KB of names, descriptions and provenance — to every
visitor, in order to render sixteen glyphs. Typechecking passed,
the build passed, and the route reported a plausible size.

The fix is `SignRef`: the five fields a client component actually
renders. Server pages resolve signs and pass them as props, which
is also cheaper because the props are part of the statically
generated page rather than a separate chunk.
`lib/data/sign-refs.ts` owns the projection, and
`tests/unit/sign-projection.test.ts` asserts it stays faithful —
including that every sign referenced by any lesson, section or quiz
question resolves, because a lesson referencing a sign outside the
resolved set renders a silently blank pill.

`discover` is the deliberate exception: it filters 274 signs as you
type, so it genuinely needs the data client-side. The page already
projects it to eleven fields, dropping `sources` — which is 159.7 KB
of the 242 KB, two thirds of the database, and is provenance nobody
searches for.

`npm run audit:bundle` reports the chunks each route actually
requests and flags any containing full-dataset markers. It exits
non-zero if a route measures 0 KB, because a silent read failure
once made it print "clean" for every route while measuring nothing —
a false all-clear is worse than a crash.

### Font weight

`Noto Sans Egyptian Hieroglyphs` is 263 KB, by some distance the
largest asset the app ships. It was preloaded, which put it on the
critical path of every route — including admin and learning pages
that need no glyphs at all — to serve one glyph in the header logo.
It is now fetched on demand. A logo that settles a moment late is
far cheaper than first paint blocked on 263 KB.

`npm run audit:fonts` reports what the stylesheet makes reachable
and cross-checks preload variants against the rendered HTML, because
the filename convention alone is not proof of what is on the
critical path.

### Removed dependencies

`framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei`,
`react-hook-form` and `@radix-ui/react-toast` were declared but never
imported. None reached a bundle — a dependency nothing imports costs
nothing at runtime — but they were load-bearing documentation for a
WebXR experience that does not exist, and this document claimed
Three.js was "installed and lazy-loaded" when it was simply unused.

### Theming

There are two themes and no `dark:` variants anywhere. The dark
palette is the design tokens in `@theme`; `html[data-theme="light"]`
redefines the same `--color-*` variables. Because every utility
resolves to `var(--color-*)` at runtime, one block of about thirty
redefinitions re-themes the entire application. There is no second
set of class names to keep in sync and no way for a component to ship
a colour that only works in one theme.

The light palette is not an inversion. It is warm limestone and buff
paper; a grey inverted dark theme reads as a rendering fault. Gold is
darkened rather than brightened, because `#c9a227` on a light surface
is 2.1:1 and `#8a6a12` is 4.5:1. Every colour in the light block was
chosen against a light surface rather than derived by rotating the
dark value.

`components/theme/theme-script.tsx` writes the theme to `<html>`
inline, before first paint. It is not an effect: an effect runs after
the first paint, which is precisely the flash of the wrong theme the
script exists to prevent. It defaults to the OS preference but an
explicit choice wins permanently, and it keeps following the OS only
while no explicit choice exists.

The toggle animates in two tiers. Where the View Transitions API
exists, the change is a single circular wipe expanding from the button
— one composited snapshot, rather than animating a hundred elements
individually, which is what makes most theme toggles feel slow.
Elsewhere it falls back to a short global crossfade applied only for
the length of one change. `prefers-reduced-motion` makes both tiers
an instant repaint.

The toggle's own visuals key off `html[data-theme]`, not React state.
A view transition snapshots the DOM the instant its callback returns,
so anything driven by a state update is captured one commit stale and
freezes mid-animation with its transition stuck at time zero. React
state carries the accessible label only.

### Typography

`lib/fonts.ts` declares five faces through `next/font`. The files are
downloaded once at build time and served from our own origin: no
runtime request ever reaches Google, which is both a privacy property
and the reason this is fast. `adjustFontFallback` generates a
metric-matched fallback per face, so swapping does not shift layout.

| Role | Face | Why |
| --- | --- | --- |
| Latin body | Inter | Legible at the 12–14px this app uses most; tabular figures, so Gardiner codes and Unicode values align in columns |
| Latin display | Marcellus | A Trajan revival. Roman inscriptional capitals — even spacing, chisel-cut strokes — are the closest typographic cousin to how hieroglyphs were actually carved |
| Arabic body | IBM Plex Sans Arabic | Same humanist skeleton as Inter, so the scripts pair without one looking borrowed; proper harakat handling |
| Arabic display | Noto Naskh Arabic | Naskh carries the weight for Arabic that Trajan carries for Latin. Heading both scripts with the same *kind* of face is what makes a bilingual layout feel designed rather than translated |
| Hieroglyphs | Noto Sans Egyptian Hieroglyphs | A correctness fix, not a taste call — see below |

The hieroglyph face is the one that matters. The sign database is
Unicode Egyptian Hieroglyphs, so rendering it depends on the visitor
having a font covering U+13000–U+1342F. Most do not: the usual
system fallbacks were Segoe UI Historic, New Athena Unicode and
GardinerA, and a visitor without them sees a tofu box for all 274
signs. An AI heritage product showing tofu for every hieroglyph is
not shippable, so the subset is shipped. Only the
`egyptian-hieroglyphs` subset is requested.

`fontVariables(locale)` applies the Arabic faces **only on Arabic
routes**. A font is downloaded when a rendered element matches it, so
leaving the variables undefined on English pages means the Arabic
files are never fetched — without giving up Arabic typography where
it is wanted. Verified: `/en` lists all five faces with the Arabic
ones `unloaded`; `/ar` reports IBM Plex Sans Arabic and Noto Naskh
Arabic as the body and display faces.

The theme itself also swaps the type system at the token level:
`html[dir="rtl"]` redefines `--font-sans` and `--font-display`, so no
component knows or cares which script it is rendering.

RTL is handled structurally. Layout uses logical properties
(`ms-`, `pe-`, `start-`, `end-`) and `dir="rtl"` on `<html>` is
set server-side, so Arabic mirrors from the first paint with no
hydration flash and no duplicated stylesheet.

### Markdown rendering

The assistant's output is rendered by a small purpose-built
component in `assistant-chat.tsx`, not a Markdown library, and
never as HTML. Model output is untrusted; rendering it as text with
a few typographic conventions removes the injection surface by
construction rather than by escaping.

## 5. Internationalisation

`next-intl` with `localePrefix: "as-needed"`. `i18n/request.ts`
resolves the locale and loads only that locale's catalog, so an
Arabic visitor never downloads the English bundle.

Egyptological transliteration characters (ꜣ ḥ ḫ ẖ ṯ ḏ) are kept in
Latin script in both languages. Transliterating them further
destroys the distinctions the characters exist to make, so they
are data, not display text.

## 6. PWA

A hand-rolled service worker (`public/sw.js`): network-first for
navigations, cache-first for static assets, and an explicit
exclusion for AI routes. Caching an AI response would let a stale
"recognition result" be presented as a live reading, which would
break the product's core promise — so offline AI fails honestly and
the UI says a connection is required.

## 7. Security and privacy

- CSP-adjacent headers in `next.config.ts`, including a
  `Permissions-Policy` scoping camera and microphone to the origin
- Uploads validated by Zod: MIME type allow-list, 10 MB ceiling,
  base64 length bound, dimensions bounded
- RBAC checked per capability, with roles mapped to permissions in
  one table rather than at each call site
- Assistant context resolved **server-side** from ids: the client
  can name what it is looking at, never assert what that object
  contains
- `escapeHtml` available for any future HTML-rendering path,
  though the current UI renders model output as text
- No telemetry by default

## 8. Testing

138 unit tests, `jsdom` environment. The interesting ones assert
behaviour that would be costly to get wrong:

- **Database integrity** — unique codes and code points, glyphs
  rendered from their declared code point, the 24 uniliterals
  checked one by one.
- **Cross-references** — every artifact is in a real room of a
  real museum; every lesson, section and quiz references a sign
  that exists; every tour stop belongs to its own museum; every
  artifact's computed map position lands inside its room.
- **The no-fabrication property** — results are schema-valid, the
  demo is labelled, a blank image yields no reading rather than a
  confident one, and the assistant says it does not know instead
  of inventing an answer.
- **RBAC** — every role's permission set, and that no role holds a
  permission it should not.

Writing these tests found eight real bugs, including two signs
whose glyphs had drifted outside their declared code points and
the unreachable `Aa` group. The suite is the reason the data is
trustworthy, not just plausible.

## 9. Deliberate omissions

Some things are stubbed rather than faked, and that is a choice:

- **Authentication** is guest mode behind a `Session` interface.
  A real IdP plugs into `getSession()`; nothing else changes.
- **Voice** uses the browser's Web Speech API, which is real, so
  there is no reason to simulate it.
- **AR/VR** are behind flags that default off. Three.js,
  `@react-three/fiber` and `@react-three/drei` were declared as
  dependencies and never imported, so they were removed rather than
  left standing as a claim that a WebXR experience exists. Shipping
  one that cannot be tested on real devices would be worse than not
  shipping one.
- **Prisma** backs PostgreSQL for writes when `DATABASE_URL` is
  set. Content reads stay on the curated dataset so a build never
  depends on the production database being reachable.
- **BullMQ/Redis** are provisioned by `docker-compose.yml` for
  translation and embedding jobs. The synchronous path is
  complete; the queue is for scale, not correctness.
- **The theme wipe was verified without pixels.** The theme
  switch, both palettes, the toggle's end states and the contrast
  ratios were all measured in the browser. The animation itself
  was not: the test browser reports `document.hidden === true`, and
  view transitions refuse to run in a hidden document — `ready`
  rejects with *"Transition was aborted because of invalid state"*.
  That rejection is why `startViewTransition` is wrapped in a
  `try`/`catch` and both of its promises are handled: a browser
  that refuses the wipe still gets the theme, via the crossfade.
  End states were confirmed by disabling transitions, which makes
  the animated properties resolve immediately instead of freezing.
  The wipe needs one pass on a visible browser before release.