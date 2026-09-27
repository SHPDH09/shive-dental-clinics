# Cloudflare — all credentials (no `.env` in production)

**Worker:** `shive-dental-clinics`  
**Settings:** https://dash.cloudflare.com/b82993580bed27dbe1dae142d07fa7e7/workers/services/view/shive-dental-clinics/production/settings

## Plain variables (in `wrangler.jsonc` — deploy with repo)

| Name | Purpose |
|------|---------|
| `AUTH_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` | Live site URL |
| `ADMIN_LOGIN_ID`, `ADMIN_EMAIL` | `rk331159@gmail.com` |
| `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |

## Encrypted secrets (Dashboard → **Add** → **Encrypt**)

| Name | Where to get value |
|------|---------------------|
| `AUTH_SECRET` | Random: `openssl rand -base64 32` |
| `ADMIN_PASSWORD` | Website admin login password |
| `SUPABASE_SECRET_KEY` | Supabase Dashboard → Project Settings → API → **secret** key |
| `SUPABASE_DB_PASSWORD` | Supabase Dashboard → Database → connection password |

Optional: `DATABASE_URL` — full Postgres URL if not using `SUPABASE_DB_PASSWORD`.

## CLI (your PC, after `wrangler login` or valid `CLOUDFLARE_API_TOKEN`)

```bash
export AUTH_SECRET='...'
export ADMIN_PASSWORD='...'
export SUPABASE_SECRET_KEY='sb_secret_...'
export SUPABASE_DB_PASSWORD='...'
npm run secrets:cloudflare
npm run deploy
```

**Do not commit `.env`.** Local preview: `dev.vars.example` → `.dev.vars`.

Login: **ADMIN_LOGIN_ID** / **ADMIN_PASSWORD** from secrets, or Supabase `Admin` table after `db:push`.
