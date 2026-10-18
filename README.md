# Manetho

AI-powered cultural heritage platform. Ancient Egypt, understood through AI.

## Quick start

```bash
npm install
npm run dev
```

Optional env:

```bash
cp .env.example .env.local     # optional — runs without any env for demo/mock mode
```

## Production / Vercel environment

| Variable | Required on Vercel? | Notes |
|----------|---------------------|--------|
| `DATABASE_URL` | Only if using Postgres | When **unset**, migrations are skipped and the app uses the in-memory dataset |
| `AI_PROVIDER` | No (default `mock`) | In production, client cannot override; server value wins |
| `OPENAI_API_KEY` / `HUAWEI_API_KEY` | If provider is openai/huawei | Required when that provider is selected |
| `AUTH_SECRET` | If `AUTH_ENABLED`/`REQUIRE_AUTH` | Must not be the example `change-me-in-production` |
| `DEMO_ADMIN_SECRET` | Optional | Elevates admin via header/cookie for demo write access |
| `DEMO_MODE` | Prefer `false` with real AI | Labels AI output as demo when true |
| `REDIS_URL` | Optional | Reserved for shared rate-limit/cache backends |

Local `docker-compose.yml` credentials are **local-only** — never reuse on shared hosts.

AI routes are rate-limited (default 20 requests / 15 minutes per IP).

Build command uses `scripts/vercel-build.sh` (migrate only when `DATABASE_URL` is set).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright |

## License

Provided as a demonstration platform. Museum metadata is demo data and must be verified against institutional records before scholarly use.
