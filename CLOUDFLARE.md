# Cloudflare Workers — Shiv Dental Clinic

Repo: `SHPDH09/shive-dental-clinics`  
Worker name: `shive-dental-clinics`

This app uses **OpenNext** (`@opennextjs/cloudflare`), not plain `next build` alone.

---

## Deploy commands

| Scenario | Command |
|----------|---------|
| Single build/deploy field | `npm run deploy` |
| Separate build | `npm run cf:build` then `npx wrangler deploy` |

Local preview: `npm run preview`

---

## Environment variables (required)

Set in **Workers & Pages → Settings → Variables** (Production):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes* | Any PostgreSQL URL reachable from Workers (e.g. Neon, Supabase). Add `?sslmode=require` if the host requires SSL. |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `AUTH_URL` / `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` | Yes | Your live Worker URL |
| `ADMIN_LOGIN_ID` | Yes (var) | e.g. `1A74N3077` |
| `ADMIN_PASSWORD` | Yes **Encrypt** | Emergency login when DB is offline |
| `ADMIN_EMAIL` | Optional | Sign in with email when env fallback is active |

\*Without `DATABASE_URL`, admin can still sign in via **ADMIN_LOGIN_ID** + **ADMIN_PASSWORD**; dashboard data features need a database.

```bash
npm run secrets:cloudflare
npm run deploy
```

Account ID: `b82993580bed27dbe1dae142d07fa7e7`

### Health checks

- `/api/health/config` — secrets configured?
- `/api/health/db` — PostgreSQL reachable?
- `/api/health/login-hints` — login checklist

Use **Node 20** or **22** in the dashboard if selectable.

Connect GitHub **`main`** for automatic deploys.
