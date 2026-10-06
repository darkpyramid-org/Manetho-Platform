# Manetho

**Ancient Egypt, understood through AI.**

Manetho is a cultural-heritage platform: it reads hieroglyphic
inscriptions from photographs, translates them with visible
per-sign confidence and cited sources, guides visitors through
museum floor plans and curated tours, and answers questions
about Egyptian history through an assistant that distinguishes
fact from interpretation and says when it does not know.

Named after Manetho of Sebennytos, the 3rd-century-BCE priest
whose division of Egyptian history into thirty dynasties is still
the standard framework.

---

## The principle the product is built on

> **Manetho never fabricates AI output.**

This is a design constraint, not a slogan. It shows up as:

- Every AI result is validated with Zod before it reaches the
  application. Invalid model output produces an error, never a
  partial answer.
- Recognition reports **per-sign confidence**. The weakest
  important sign is visible, not averaged away.
- When confidence is too low to support a reading, the pipeline
  **stops** and says "We couldn't confidently read this
  inscription." — with instructions for improving the photo, and
  a manual sign picker as an escape hatch.
- The assistant separates established fact, common reading,
  interpretation and unknown, and cites the standard literature.
- Demo-mode output is labelled as demo output everywhere it
  appears, including in the site footer and the admin review
  queue.
- Seed data carries `provenance: "Demo dataset"` on every record.

## Quick start

```bash
npm install
cp .env.example .env.local     # optional — runs without any env
npm run dev
```

Open <http://localhost:3000>. English is unprefixed; Arabic is at
`/ar`.

There is nothing to configure for the default experience: no
database, no API key, no external service. The deterministic
**Mock** provider handles every AI capability and is clearly
labelled as demo output.

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (next/core-web-vitals + typescript) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit suite |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create/apply a migration |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed the database from the demo dataset |
| `npm run db:studio` | Browse the database |

### With PostgreSQL

```bash
cp .env.example .env
# set DATABASE_URL
npm install
npm run db:generate        # generate the Prisma client
npm run db:migrate         # create the schema
npm run db:seed            # load the demo dataset
npm run db:studio          # browse it
```

With `DATABASE_URL` set, Manetho:

- writes every inscription reading to the `Translation` table,
  including per-sign confidence, so results can be reviewed and
  audited later;
- feeds the admin AI review queue from real rows;
- reports connectivity and stored row counts at `/api/health`.

Without `DATABASE_URL` it falls back to the in-memory dataset in
`lib/data`, which implements the same repository interfaces — so
nothing downstream knows the difference, and the app still runs.

### With Redis and object storage

```bash
docker compose up -d       # postgres, redis, minio
```

Redis and MinIO are provisioned for translation/embedding job
queues and image storage. The synchronous path is complete
without them.

## What is in the box

**Content (all clearly marked demo data)**

- 4 museums — Grand Egyptian Museum, Egyptian Museum Cairo,
  Museo Egizio, British Museum — with two floors each
- 20 objects with accurate, sourced metadata
- **274 hieroglyphs** with Gardiner codes, Unicode code points and
  phonetic values, verified against the Unicode Egyptian
  Hieroglyphs block
- 10 lessons across 4 courses, with quizzes that explain every
  answer
- 5 guided museum tours
- 10 synthetic sample inscriptions that genuinely draw the signs
  they name

**Features**

- **Translator** — upload, camera capture, crop, per-sign
  confidence, alternative readings, grammar and context notes,
  cited sources, manual sign selection
- **Assistant** — streaming over SSE, four answer modes
  (visitor / educational / research / guide), citations, attached
  artifact and reading context, voice input and read-aloud via
  the Web Speech API
- **Museums** — interactive SVG floor plans in a 0–1000 plan
  space, room-level object lists, accessibility markers, tours
- **Discover** — instant client-side search across the whole
  knowledge base, filterable by Gardiner category and sign type
- **Workspace** (`/app`) — mobile-first shell with bottom
  navigation, offline indicator and PWA install prompt
- **Admin** — role and permission matrix, provider status, an AI
  review queue that shows exactly what a visitor sees

## Architecture in one paragraph

Business logic lives in services, repositories and AI providers —
never in React components. The browser talks to typed API routes
that return either data or a single error envelope
(`{error: {code, message, requestId}}`). AI work goes through a
single gateway that selects a provider bundle, orchestrates the
pipeline and validates the result. Four providers — **OpenAI**,
**Huawei Cloud**, **Local** (Ollama-compatible), **Mock** — are
interchangeable behind seven interfaces: vision, OCR,
translation, LLM, embedding, STT and TTS. The frontend never knows
which is active.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full picture.

## Internationalisation

English and Arabic are both first-class. `/` serves English;
`/ar/*` serves Arabic with `dir="rtl"` set on the document, so
the layout mirrors from the first paint rather than after
hydration. Only the active locale's message catalog is loaded.

Layout uses logical properties (`ms-`, `pe-`, `start-`, `end-`)
throughout, so RTL needs no separate stylesheet.

## Accessibility

- WCAG 2.2 AA: visible focus rings, skip link, landmark regions,
  labelled controls, `aria-live` for streaming and analysis states
- Hieroglyphs are exposed to screen readers as English names, not
  as glyphs a screen reader cannot pronounce
- Confidence is never conveyed by colour alone — the level is
  always spelled out
- `prefers-reduced-motion` is honoured globally
- Minimum 44px touch targets in the workspace shell
- Mobile-first throughout, including the translator and floor plans

## Testing

```bash
npm test
```

138 unit tests covering:

- the hieroglyph database's integrity (unique codes and code
  points, every glyph rendered from its declared code point, the
  24 uniliterals verified individually)
- seed-data cross-references (every artifact sits in a real room
  of a real museum, every lesson and quiz references real signs,
  every tour stop is in its own museum)
- the AI pipeline (schema validity, determinism, demo labelling,
  the low-confidence refusal to guess, provider selection)
- RBAC (every role's permission set, and that no role gains a
  permission it lacks)
- utilities

The suite found real bugs during development, including two signs
whose glyph shape had drifted outside the block their own Unicode
value claimed, and the entire `Aa` Gardiner group being
unreachable through case-insensitive lookup.

## Configuration

Every feature is behind a flag; see `.env.example`.

| Variable | Default | Effect |
| --- | --- | --- |
| `AI_PROVIDER` | `mock` | `mock`, `openai`, `huawei`, `local` |
| `OPENAI_API_KEY` | — | Required for the OpenAI provider |
| `HUAWEI_API_KEY` | — | Required for the Huawei provider |
| `LOCAL_BASE_URL` | `http://localhost:11434/v1` | Local model server |
| `DEMO_MODE` | `true` | Labels AI output as demo |
| `DATABASE_URL` | — | Enables the Prisma repository |
| `ENABLE_TRANSLATOR` | `true` | Feature flag |
| `ENABLE_AI_ASSISTANT` | `true` | Feature flag |
| `ENABLE_VOICE` | `true` | Feature flag |
| `ENABLE_MUSEUM_MAP` | `true` | Feature flag |
| `ENABLE_AR` / `ENABLE_VR` | `false` | Feature flag |
| `ENABLE_LEARNING` | `true` | Feature flag |
| `ENABLE_RESEARCH_MODE` | `true` | Feature flag |
| `ENABLE_OFFLINE_MODE` | `true` | Feature flag |

`.env` is gitignored. Never commit it.

## License

Provided as a demonstration platform. Museum metadata is demo
data and must be verified against institutional records before
scholarly use.