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

`lib/data` is the curated in-memory repository. `lib/data/index.ts`
defines the interfaces — `MuseumRepository`, `ArtifactRepository`,
`HieroglyphRepository`, `LearningRepository`, `TourRepository` —
and the seed dataset implements them.

`lib/server/repository.ts` implements the same interfaces against
PostgreSQL via Prisma. `lib/server/prisma.ts` owns the client
singleton (one connection pool per process, not one per hot
reload).

### Which one is active

`DATABASE_URL` decides. Nothing above the repository layer changes
when it is set. The division of labour is deliberate:

- **Content reads** — museums, artifacts, signs, lessons, tours —
  are statically generated at build time from the curated dataset.
  This is a feature: the sign database and museum records are
  reference material that changes on a review cycle, not per
  request, and static generation makes them fast, cacheable and
  available offline.
- **Writes** go to PostgreSQL. Every inscription reading is stored
  with its per-sign confidence, which is what makes the admin
  review queue real rather than a mock-up, and what allows
  readings to be compared between providers later.

`/api/health` reports which path is live, whether the database is
reachable, and the stored row counts — so a deployment's state is
observable without guessing.

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
- **AR/VR** are behind flags that default off. Three.js is
  installed and lazy-loaded, but shipping a WebXR experience that
  cannot be tested on real devices would be worse than not
  shipping one.
- **Prisma** backs PostgreSQL when `DATABASE_URL` is set. The
  repository interface is the contract; the in-memory dataset and
  the Prisma implementation are interchangeable, so the app runs
  with no database and full functionality for content reads.
- **BullMQ/Redis** are provisioned by `docker-compose.yml` for
  translation and embedding jobs. The synchronous path is
  complete; the queue is for scale, not correctness.