# Shiv Dental Clinic — Management Platform

Production-style dental clinic software: premium patient website, online booking, and a full admin dashboard (appointments, patients, leads/CRM, content, reports).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **PostgreSQL** via Prisma 7 (`@prisma/adapter-pg`) — any host (local, Neon, Supabase, etc.)
- **NextAuth** (admin credentials + optional env fallback when DB is offline)
- Media uploads to **`public/uploads`** (local dev; use Cloudflare R2 or similar on Workers if needed)

## Setup

```bash
npm install
cp env.example .env
# Edit .env: DATABASE_URL, AUTH_SECRET, ADMIN_LOGIN_ID, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:push
npm run admin:reset
npm run dev
```

- **Website:** http://localhost:3000  
- **Admin:** http://localhost:3000/admin/login  

Verify database:

```bash
npx tsx scripts/test-db-pool.ts
curl http://localhost:3000/api/health/db
```

## Features

| Area | Capabilities |
|------|----------------|
| Public site | Hero, services, doctors, testimonials, gallery, before/after, contact, WhatsApp/call CTAs, SEO |
| Booking | Validated appointment form → admin notification |
| Admin | Dashboard, appointments, patients, leads CRM, services, doctors, media, reports, settings |
| Security | Protected `/admin` routes, JWT session, validated uploads |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:seed` | Seed demo content |
| `npm run admin:reset` | Create/update super admin in DB |

## Cloudflare

See `CLOUDFLARE.md` for Workers deploy and secrets.
