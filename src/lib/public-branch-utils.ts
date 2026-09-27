import { formatWeeklyScheduleLines } from "@/lib/doctor-schedule";
import type { PublicBranch } from "@/lib/public-branch-types";

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
