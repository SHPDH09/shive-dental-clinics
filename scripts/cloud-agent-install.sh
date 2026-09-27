#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap: deps + optional AWS RDS (Prisma push/seed).
set -euo pipefail
cd "$(dirname "$0")/.."

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"

npm ci

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is set; checking AWS RDS PostgreSQL..."
  if npx tsx scripts/test-rds-pool.ts; then
    npx prisma db push
    npx tsx prisma/seed.ts
    echo "RDS: schema applied and seed completed."
  else
    echo "WARN: RDS reachable but login failed or connection error."
    echo "      Fix AWS RDS (password/IAM auth, security group 5432) and re-run: npm run db:setup"
  fi
else
  echo "DATABASE_URL not set. Add Cursor environment secret DATABASE_URL (RDS writer URL, sslmode=require)."
fi
