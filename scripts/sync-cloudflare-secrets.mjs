#!/usr/bin/env node
/**
 * Push Worker secrets to Cloudflare (Production).
 * Does not read .env — pass values via environment or CI secrets.
 *
 * Example:
 *   AUTH_SECRET=... ADMIN_PASSWORD=... SUPABASE_SECRET_KEY=... SUPABASE_DB_PASSWORD=... \
 *     npm run secrets:cloudflare
 */
import { spawnSync } from "node:child_process";

const SECRETS = [
  "AUTH_SECRET",
  "ADMIN_PASSWORD",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_DB_PASSWORD",
  "DATABASE_URL",
];

const REQUIRED = [
  "AUTH_SECRET",
  "ADMIN_PASSWORD",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_DB_PASSWORD",
];

for (const name of SECRETS) {
  const value = process.env[name]?.trim();
  if (!value) {
    if (REQUIRED.includes(name)) {
      console.error(`Missing required env var: ${name}`);
      console.error("Set in shell or GitHub Actions secrets, then rerun.");
      process.exit(1);
    }
    console.log(`Skipping ${name} (not set)`);
    continue;
  }
  console.log(`Setting wrangler secret: ${name}…`);
  const r = spawnSync("npx", ["wrangler", "secret", "put", name], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`Failed to set ${name}. Token needs Workers Scripts Edit + secrets.`);
    process.exit(r.status ?? 1);
  }
}

console.log("Cloudflare secrets updated. Run: npm run deploy");
