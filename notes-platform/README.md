# Premium Notes Marketplace

Production-ready notes selling platform with **Student Panel** and **Admin Panel**, built with Next.js (React + TypeScript), Tailwind CSS, PostgreSQL (Prisma), NextAuth credentials auth, Supabase Storage for files, and Cashfree (or mock) payments.

## Project structure

```
notes-platform/
├── prisma/schema.prisma      # Database schema
├── prisma/seed.ts            # Admin bootstrap (env-based)
├── src/app/                  # App Router pages + API routes
├── src/components/           # UI + layout components
├── src/config/brand.ts       # Brand name/logo text (easy rebrand)
└── src/lib/                  # Auth, checkout, coupons, storage, payment
```

## Setup (local)

```bash
cd notes-platform
cp .env.example .env.local
# Edit DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

npm install
npm run db:setup    # prisma db push + seed admin
npm run dev         # http://localhost:3001
```

## Admin login setup

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your environment (never commit real passwords).
2. Run `npm run db:seed` — the password is bcrypt-hashed before insert.
3. Open `/admin/login` and sign in with those credentials.

## Database schema

See `prisma/schema.prisma` for normalized tables: `User`, `Note`, `Coupon`, `CouponNote`, `CouponUsage`, `CartItem`, `Order`, `OrderItem`, `Transaction`, `Purchase`, `AdminProfile`.

## Vercel deployment

1. Create a Vercel project with **Root Directory** = `notes-platform`.
2. Add environment variables from `.env.example` in the Vercel project settings.
3. Build command: `npm run build`
4. Install command: `npm install`
5. Run `npm run db:setup` once against production `DATABASE_URL` (local CLI or CI job).

Set `PAYMENT_PROVIDER=mock` only for staging; use Cashfree keys in production.

## Security notes

- All pricing, coupons, and ownership checks are enforced in API routes.
- Private PDFs use storage paths + signed URLs after purchase verification.
- Admin APIs require `ADMIN` role; student APIs require `STUDENT` role.
- Never expose `DATABASE_URL`, service role keys, or payment secrets to the client.
