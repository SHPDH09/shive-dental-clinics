/**
 * Regression checks for Cloudflare Worker CPU (Error 1102) mitigations.
 * Run: npx tsx scripts/test-worker-cpu-guards.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

let failed = 0;

function assert(name: string, ok: boolean) {
  if (!ok) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`ok: ${name}`);
  }
}

const middleware = read("src/middleware.ts");
assert("middleware skips public HTML routes", !middleware.includes("/((?!api"));
assert("middleware still protects admin", middleware.includes('pathname.startsWith("/admin")'));

const cached = read("src/lib/cached-public.ts");
assert("homepage hero slides cached", cached.includes("getCachedPublicHeroSlides"));
assert("homepage services cached", cached.includes("getCachedFeaturedPublicServices"));

const hero = read("src/lib/hero-slides.ts");
assert("public hero slides avoid admin cookie client", !hero.includes("getAdminSupabaseClient"));

const headers = read("next.config.ts");
assert("security headers configured globally", headers.includes("SECURITY_HEADERS"));

if (failed > 0) {
  process.exit(1);
}

console.log("All worker CPU guard checks passed.");
