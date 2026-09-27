#!/usr/bin/env node
/**
 * Push runtime secrets to Cloudflare Workers (Production).
 * Requires: wrangler auth (CLOUDFLARE_API_TOKEN or wrangler login).
 * Reads from .env — never commit real .env.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));

const SECRETS = ["DATABASE_URL", "AUTH_SECRET", "ADMIN_PASSWORD"];

for (const name of SECRETS) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing ${name} in environment or .env`);
    process.exit(1);
  }
  console.log(`Setting wrangler secret: ${name}…`);
  const r = spawnSync("npx", ["wrangler", "secret", "put", name], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`Failed to set ${name}. Use CLOUDFLARE_API_TOKEN or wrangler login.`);
    process.exit(r.status ?? 1);
  }
}

console.log("Cloudflare secrets updated. Run: npm run deploy");
