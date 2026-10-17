import { formatWeeklyScheduleLines } from "@/lib/doctor-schedule";
import type { PublicBranch } from "@/lib/public-branch-types";

/** Extract `src` when admins paste a full `<iframe …>` snippet instead of a URL. */
function extractMapEmbedSrcFromHtml(raw: string): string | null {
  const match =
    raw.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i) ??
    raw.match(/\ssrc=["']([^"']+)["']/i);
  const src = match?.[1]?.trim();
  return src || null;
}

/**
 * Returns an https URL safe for `<iframe src>`, or null if the value is invalid
 * (e.g. relative path, HTML without a src, or non-URL text).
 */
export function normalizeMapEmbedUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let value = raw.trim();
  if (!value) return null;

  if (value.includes("<") || value.includes("&lt;")) {
    const htmlLike = value
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    const extracted = extractMapEmbedSrcFromHtml(htmlLike);
    if (!extracted) return null;
    value = extracted;
  }

  if (value.startsWith("//")) value = `https:${value}`;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (parsed.protocol === "http:") parsed.protocol = "https:";

  return parsed.toString();
}

export function branchMapIframeSrc(branch: PublicBranch): string | null {
  const custom = normalizeMapEmbedUrl(branch.mapEmbedUrl);
  if (custom) return custom;

  const lat = branch.latitude?.trim();
  const lng = branch.longitude?.trim();
  if (lat && lng) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&output=embed`;
  }

  const addr = branch.fullAddress?.trim();
  if (addr) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&output=embed`;
  }

  return null;
}

export function searchPublicBranches(
  branches: PublicBranch[],
  query: { q?: string; city?: string; pin?: string },
): PublicBranch[] {
  const q = query.q?.trim().toLowerCase();
  const city = query.city?.trim().toLowerCase();
  const pin = query.pin?.trim();

  return branches.filter((b) => {
    if (city && !b.city.toLowerCase().includes(city)) return false;
    if (pin && b.pinCode !== pin) return false;
    if (!q) return true;
    const hay = `${b.name} ${b.address} ${b.city} ${b.state ?? ""} ${b.pinCode ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

export function branchDirectionsUrl(branch: PublicBranch): string {
  if (branch.mapUrl) return branch.mapUrl;
  if (branch.latitude && branch.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.fullAddress)}`;
}

export function branchOpeningLines(branch: PublicBranch): string[] {
  const lines = formatWeeklyScheduleLines(branch.weeklySchedule);
  if (lines.some((l) => !l.includes("Closed"))) return lines;
  return lines;
}
