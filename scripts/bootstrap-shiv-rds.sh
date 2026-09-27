#!/usr/bin/env bash
# Connect, create tables, seed website admin (1A74N3077 / rk331159@gmail.com / Raunak@12583).
set -euo pipefail
cd "$(dirname "$0")/.."

export DATABASE_URL="${DATABASE_URL:-postgresql://admin:Raunak12583@shiv-dental-clinic.c5mm0sc887f3.ap-south-1.rds.amazonaws.com:5432/postgres?schema=public&sslmode=require}"
export ADMIN_LOGIN_ID="${ADMIN_LOGIN_ID:-1A74N3077}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-rk331159@gmail.com}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-Raunak@12583}"

echo "Using host: $(echo "$DATABASE_URL" | sed -E 's#:[^:@/]+@#:****@#')"
npm run db:setup
npm run admin:reset
echo "Bootstrap complete."
