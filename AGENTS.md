<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cloud Agent (main + AWS RDS)

- Default branch: **main**. Environment config: `.cursor/environment.json` → `scripts/cloud-agent-install.sh`.
- **Secrets** (Cursor environment panel, never commit): `DATABASE_URL` (RDS writer, `sslmode=require`), `AUTH_SECRET`. Admin login is **database-only** (`Admin` table); no env-file password fallback.
- RDS host: `shiv-dental-clinic.c5mm0sc887f3.ap-south-1.rds.amazonaws.com:5432`, database `postgres`, user `admin`. Instance must be **PostgreSQL**, **publicly accessible**, SG allows 5432.
- Verify DB: `npx tsx scripts/test-rds-pool.ts` or `npm run db:setup` (push + seed). Health: `/api/health/db`, `/api/health/config`.
- Dev: `npm run dev` (terminal). Production build: `NODE_OPTIONS=--max-old-space-size=8192 npm run build`. Cloudflare: `npm run cf:build` / `npm run deploy` (see `CLOUDFLARE.md`).
- If RDS returns `PAM authentication failed` / `28P01`: disable IAM DB auth on the cluster or reset the master password and allow inbound **5432** on the RDS security group for agent egress IPs.

