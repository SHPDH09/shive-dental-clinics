/**
 * Cloudflare/OpenNext CI often runs `next build` without DATABASE_URL.
 * Provide safe placeholders so module analysis and SSG never crash on missing env.
 * AUTH_SECRET must match runtime resolveAuthSecret() on Workers (see auth-env.ts).
 */
import { spawnSync } from "node:child_process";

const PRODUCTION_AUTH_SECRET =
  "4bcc5249f10b987ba024c609fdad337d5fff96292712528bcdd6372a56224da5";

const onVercel = process.env.VERCEL === "1";

if (!process.env.DATABASE_URL?.trim() && !onVercel) {
  process.env.DATABASE_URL =
    "postgresql://build:build@127.0.0.1:5432/build?schema=public&sslmode=disable";
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://ojfxtzwzpoosmzotzyxm.supabase.co";
}

if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()) {
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_dq17MrYSzQxIErqpSjZ2SA_222lhWg_";
}

process.env.AUTH_SECRET = process.env.AUTH_SECRET?.trim() || PRODUCTION_AUTH_SECRET;

const cmd = process.argv.slice(2);
if (cmd.length === 0) {
  console.error("Usage: node scripts/with-build-env.mjs <command> [args...]");
  process.exit(1);
}

const [bin, ...args] = cmd;
const result = spawnSync(bin, args, {
  stdio: "inherit",
  env: process.env,
  shell: false,
});

process.exit(result.status ?? 1);
