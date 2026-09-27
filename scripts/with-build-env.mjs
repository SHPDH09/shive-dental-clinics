/**
 * Cloudflare/OpenNext CI often runs `next build` without DATABASE_URL.
 * Provide safe placeholders so module analysis and SSG never crash on missing env.
 * Runtime must set real DATABASE_URL + AUTH_SECRET in Cloudflare dashboard.
 */
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL =
    "postgresql://build:build@127.0.0.1:5432/build?schema=public&sslmode=disable";
}

if (!process.env.AUTH_SECRET?.trim()) {
  process.env.AUTH_SECRET = "build-time-placeholder-set-auth-secret-in-cloudflare";
}

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
