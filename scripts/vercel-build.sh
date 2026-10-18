#!/usr/bin/env bash
# Conditional Prisma migrate: only when DATABASE_URL is set.
# Aligns with README "runs without any env" for local/demo builds.
set -euo pipefail

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[manetho] DATABASE_URL set — running prisma migrate deploy"
  npx prisma migrate deploy
else
  echo "[manetho] DATABASE_URL unset — skipping migrations (in-memory / demo mode)"
fi

npx prisma generate
npx next build
