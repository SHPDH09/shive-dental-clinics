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

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://admin:****@database-1.cluster-c5mm0sc887f3.ap-south-1.rds.amazonaws.com:5432/shiv-dental-clinic?schema=public&sslmode=require` |
| `AUTH_SECRET` | long random string |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.workers.dev` or custom domain |

Build also works without `DATABASE_URL` (placeholder at build time), but **Production must have real values** for the live site and admin.

---

## Node.js

Use **Node 20** or **22** if the dashboard lets you choose (24 often works; 20 is safest).

---

## Branch

Connect **GitHub `main`** branch for automatic deploys.
