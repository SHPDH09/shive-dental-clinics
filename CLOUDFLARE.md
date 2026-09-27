# Cloudflare Workers — Shiv Dental Clinic

Repo: `SHPDH09/shive-dental-clinics`  
Worker name: `shive-dental-clinics`

This app uses **OpenNext** (`@opennextjs/cloudflare`), not plain `next build` alone.

---

## Cloudflare dashboard — what to enter

### If you have **one** “Build / Deploy command” field

Use:

```bash
npm run deploy
```

This runs OpenNext build + `wrangler deploy`.

---

### If you have **separate** Build and Deploy fields

| Field | Command |
|--------|---------|
| **Build command** | `npm run cf:build` |
| **Deploy command** | `npx wrangler deploy` |

Do **not** use only `npm run build` — that skips OpenNext and Workers packaging.

Do **not** use only `npx wrangler deploy` on first setup without `cf:build` — build output must exist in `.open-next/`.

---

### Optional: Preview locally

```bash
npm run preview
```

---

## Environment variables (required)

Set in **Workers & Pages → your project → Settings → Variables** for **Production** and **Build**:

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | `postgresql://admin:****@database-1.cluster-c5mm0sc887f3.ap-south-1.rds.amazonaws.com:5432/shiv-dental-clinic?schema=public&sslmode=require` |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` output |
| `AUTH_URL` | Yes | `https://shive-dental-clinics.<account>.workers.dev` (your live site URL) |
| `NEXTAUTH_URL` | Yes | same as `AUTH_URL` |
| `NEXT_PUBLIC_APP_URL` | Yes | same as `AUTH_URL` |
| `ADMIN_LOGIN_ID` | Yes (or wrangler var) | `1A74N3077` |
| `ADMIN_PASSWORD` | Yes **Encrypt** | your admin password (e.g. `Rishikesh@2028`) — needed when RDS is not connected yet |

Until RDS works, login uses **ADMIN_LOGIN_ID** + **ADMIN_PASSWORD** from Cloudflare secrets. After RDS works, run `npm run admin:reset` and DB login takes over.

**Admin `/api/auth/session` 500 error** almost always means **`AUTH_SECRET` or `AUTH_URL` is missing** in Cloudflare Variables (Production).

After deploy, check:

- `https://YOUR-SITE/api/health/config` — auth + DATABASE_URL configured?
- `https://YOUR-SITE/api/health/db` — RDS reachable?

### AWS RDS from Cloudflare

1. RDS must be **publicly accessible** (or use **Cloudflare Hyperdrive** to your RDS URL).
2. Security group: allow **PostgreSQL 5432** from the internet (or Hyperdrive only).
3. Use the writer endpoint and database name `shiv-dental-clinic`.

Build works without real env vars; **Production must have all variables above**.

---

## Node.js

Use **Node 20** or **22** if the dashboard lets you choose (24 often works; 20 is safest).

---

## Branch

Connect **GitHub `main`** branch for automatic deploys.
