/**
 * Map embed URL normalization (branch pages paste full iframe HTML).
 * Run: npx tsx scripts/test-map-embed-url.ts
 */
import { branchMapIframeSrc, normalizeMapEmbedUrl } from "../src/lib/public-branch-utils";
import type { PublicBranch } from "../src/lib/public-branch-types";

let failed = 0;

function assert(name: string, ok: boolean) {
  if (!ok) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`ok: ${name}`);
  }
}

const pastedIframe =
  '<iframe src="https://www.google.com/maps/embed?pb=!1m16!1m12" width="600" height="450" style="border:0;" allowfullscreen loading="lazy"></iframe>';

const normalized = normalizeMapEmbedUrl(pastedIframe);
assert("extracts src from pasted iframe HTML", normalized === "https://www.google.com/maps/embed?pb=!1m16!1m12");
assert("rejects relative paths", normalizeMapEmbedUrl("/branches/foo") === null);

const branch = {
  mapEmbedUrl: pastedIframe,
  latitude: null,
  longitude: null,
  fullAddress: "Nimiya Branch, Banka",
} as PublicBranch;

assert(
  "branchMapIframeSrc uses extracted Google embed URL",
  Boolean(branchMapIframeSrc(branch)?.includes("google.com/maps/embed")),
);

const fallback = {
  mapEmbedUrl: null,
  latitude: null,
  longitude: null,
  fullAddress: "Test Address, City",
} as PublicBranch;
assert(
  "branchMapIframeSrc falls back to address query",
  Boolean(branchMapIframeSrc(fallback)?.includes("output=embed")),
);

if (failed > 0) process.exit(1);
console.log("All map embed URL checks passed.");
