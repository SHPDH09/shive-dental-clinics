<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cloud Agent

- Default branch: **main**. Install: `.cursor/environment.json` → `scripts/cloud-agent-install.sh`.
- **No `.env` in repo.** Production secrets live in Cloudflare (`CLOUDFLARE-SECRETS.md`). Cursor/CI inject env vars when needed.
- Verify DB: `npx tsx scripts/test-db-pool.ts` or `npm run db:setup`. Health: `/api/health/db`, `/api/health/config`.
- Dev: `npm run dev`. Build: `NODE_OPTIONS=--max-old-space-size=8192 npm run build`. Cloudflare: `npm run cf:build` / `npm run deploy` (`CLOUDFLARE.md`).
