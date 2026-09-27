# Supabase — Shiv Dental Clinic

Project URL: `https://ojfxtzwzpoosmzotzyxm.supabase.co`

## Variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Wrangler vars / `.env` | Browser + server project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Wrangler vars / `.env` | Supabase Data API (client-safe) |
| `SUPABASE_SECRET_KEY` | **Encrypted secret only** | Server admin API + auth fallback (`sb_secret_…`) |
| `DATABASE_URL` or `SUPABASE_DB_PASSWORD` | Encrypted secret | Prisma → same Postgres as Supabase |

Get **database password** and **secret key** from [Supabase Dashboard](https://supabase.com/dashboard/project/ojfxtzwzpoosmzotzyxm/settings/api) → Project Settings.

## First-time database setup

From your machine (with password in `.env`):

```bash
# Option A — full URL from Dashboard → Connect → Prisma
DATABASE_URL="postgresql://..." npm run db:push

# Option B — password only
SUPABASE_DB_PASSWORD="your-db-password" npm run db:push

npm run admin:reset
```

## Health checks

- `/api/health/supabase` — publishable key + REST API
- `/api/health/db` — Prisma PostgreSQL (Supabase DB)

## Cloudflare

Public vars are in `wrangler.jsonc`. Set encrypted secrets:

- `SUPABASE_SECRET_KEY`
- `DATABASE_URL` **or** `SUPABASE_DB_PASSWORD`
- `AUTH_SECRET`, `ADMIN_PASSWORD`

```bash
npm run secrets:cloudflare
npm run deploy
```
