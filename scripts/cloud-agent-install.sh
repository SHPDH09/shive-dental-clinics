#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap: deps + optional PostgreSQL (Prisma push/seed).
set -euo pipefail
cd "$(dirname "$0")/.."

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"

# Cursor Runtime Secrets inject env vars; local dev / this VM may use gitignored `.env`.
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

npm ci

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is set; checking PostgreSQL..."
  if npx tsx scripts/test-db-pool.ts; then
    npx prisma db push
    npx tsx prisma/seed.ts
    echo "Database: schema applied and seed completed."
  else
    echo "WARN: DATABASE_URL set but connection failed. Fix credentials/host and re-run: npm run db:setup"
  fi
else
  echo "DATABASE_URL not set. Add a PostgreSQL URL to .env or Cursor environment secrets."
fi
