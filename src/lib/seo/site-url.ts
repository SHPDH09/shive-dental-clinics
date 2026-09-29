/** Canonical public site URL for SEO, sitemap, and JSON-LD. */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://shivdantelclinic.com";
  return raw.replace(/\/$/, "");
}

export const DEFAULT_SEO_KEYWORDS = [
  "Shiv Dental Clinic",
  "dentist near me",
  "dental clinic India",
  "teeth cleaning",
  "root canal treatment",
  "dental implants",
  "smile makeover",
  "cosmetic dentistry",
  "pediatric dentist",
  "emergency dental care",
  "book dental appointment online",
].join(", ");
