# Shiv Dental Clinic — Management Platform

Production-style dental clinic software: premium patient website, online booking, and a full admin dashboard (appointments, patients, leads/CRM, content, reports).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **PostgreSQL** on **AWS RDS** via Prisma 7 (`@prisma/adapter-pg`)
- **NextAuth** (admin credentials)
- Optional **AWS S3** for media (local `/public/uploads` fallback)

## AWS RDS

Writer endpoint (use in `DATABASE_URL`):

`database-1.cluster-c5mm0sc887f3.ap-south-1.rds.amazonaws.com:5432`

Read replica (optional):

`database-1.cluster-ro-c5mm0sc887f3.ap-south-1.rds.amazonaws.com:5432`

### Database connection check

1. Copy `env.example` → `.env` and set real RDS username, password, and database name.
2. Run:

```bash
npm run db:push
npm run db:seed
```

3. Verify:

```bash
curl http://localhost:3000/api/health/db
```

Or: `npx tsx scripts/test-rds-pool.ts`

**Status from this environment:** the RDS host is **reachable on port 5432**, but the app is **not fully connected** until valid credentials replace `YOUR_USERNAME` / `YOUR_PASSWORD` in `.env`. Without those, authentication fails (expected).

Ensure the RDS security group allows inbound **5432** from your app server IP/VPC.

## Setup

```bash
npm install
cp env.example .env
# Edit .env: DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:push
npm run db:seed
npm run dev
```

- **Website:** http://localhost:3000  
- **Admin:** http://localhost:3000/admin/login  
- **Default admin (after seed):** `admin@shivdentalclinic.com` / `Admin@123` (change in production)

## Features

| Area | Capabilities |
|------|----------------|
| Public site | Hero, services, doctors, testimonials, gallery, before/after, contact, WhatsApp/call CTAs, SEO (sitemap, robots, JSON-LD) |
| Booking | Validated appointment form → `Pending` status + appointment ID + admin notification |
| Admin | Dashboard charts, appointments, patients, leads CRM, services, doctors, media, reports CSV export, settings |
| Security | Protected `/admin` routes, JWT session, validated uploads |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:push` | Apply Prisma schema to RDS |
| `npm run db:seed` | Seed admin, services, demo content |

## IAM / RDS

For IAM database authentication, configure RDS IAM auth on the instance and use an IAM-enabled connection flow in addition to updating `DATABASE_URL`. The current app uses standard username/password PostgreSQL URLs.
