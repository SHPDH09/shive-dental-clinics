# Security & traffic hardening

This app runs on **Cloudflare Workers** (primary) or **Vercel** (Next.js). Code-level protections are in the repo; edge WAF and some secrets require dashboard configuration.

## Required secrets (Cloudflare Workers)

Set via **Dashboard → Workers → shive-dental-clinics → Settings → Variables** (encrypt secrets) or `wrangler secret put`:

| Secret | Purpose |
|--------|---------|
| `AUTH_SECRET` | Strong random 32+ char string for JWT sessions (**required**; do not rely on default) |
| `SUPABASE_SECRET_KEY` | Supabase service role |
| `SUPABASE_DB_PASSWORD` | Postgres pooler password |
| `ADMIN_LOGIN_ID` / `ADMIN_EMAIL` | Admin login identifier |
| `ADMIN_PASSWORD` | Admin password (encrypted) |
| `HEALTHCHECK_TOKEN` | Bearer token for `/api/health/*` in production |
| `DATABASE_URL` | Optional if using pooler password only |

**Removed from `wrangler.jsonc`:** `SUPABASE_SKEY_B64`, `SUPABASE_DB_PW_B64`, plain admin emails — rotate Supabase service role & DB password if they were ever committed.

Break-glass env login: set `ENABLE_ENV_ADMIN_LOGIN=1` only during emergencies.

## Supabase RLS

```bash
SUPABASE_DB_PASSWORD='...' npm run supabase:apply-rls
```

Applies authenticated admin policies + **deny anon** on sensitive tables.

## Health checks (production)

Without `HEALTHCHECK_TOKEN`, `/api/health/*` returns **404**.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-domain/api/health/db
```

## Rate limits (application)

| Route | Limit |
|-------|--------|
| POST `/api/public/enquiries` | 8 / hour / IP |
| POST `/api/public/appointments` | 12 / hour / IP |
| GET `/api/public/appointments/slots` | 90 / hour / IP |
| POST `/api/public/videos/*/view` | 40 / min / IP |
| POST `/api/admin/session-login` | 15 / 15 min / IP |
| POST `/api/auth/*` | 15 / 15 min / IP |

Per-isolate in-memory limits — add **Cloudflare Rate Limiting** (below) for global 30k+ spike protection.

## Cloudflare dashboard (manual — recommended)

### WAF managed rules

1. **Security → WAF → Managed rules** → enable OWASP Core Ruleset and Cloudflare Managed Ruleset.
2. **Security → Bots** → enable **Bot Fight Mode** or **Super Bot Fight Mode** (paid).

### Rate limiting rules (example)

Create rules under **Security → WAF → Rate limiting rules**:

1. **Admin login abuse** — URI Path contains `/api/admin/session-login` or `/api/auth/` — 30 requests / 5 minutes / IP — Block.
2. **Public forms** — URI Path contains `/api/public/` — 100 requests / 1 minute / IP — Managed challenge.
3. **Health** — URI Path starts with `/api/health` — 10 / minute / IP — Block (unless you use a monitoring IP allowlist).

### DDoS

**Security → DDoS** — ensure HTTP DDoS attack protection is **High** (default on Pro+).

### Cache

**Caching → Cache Rules** — cache `GET` for `/branding/*`, static assets; bypass cache for `/admin`, `/api/admin`, `/api/auth`.

### SSL/TLS

**SSL/TLS → Full (strict)**; enable **Always Use HTTPS** and **HSTS**.

## Vercel

Set the same environment variables in **Project → Settings → Environment Variables**. Use `npm run build` (see `vercel.json`). Provide real `DATABASE_URL` or Supabase keys so build-time SSG can reach data, or rely on dynamic rendering.

## Verification checklist

- [ ] `npm run build` passes
- [ ] Admin login works with DB credentials
- [ ] Public appointment + contact forms work
- [ ] `/api/health/db` returns 404 without token, 200 with token
- [ ] Cloudflare secrets deployed after removing vars from git
