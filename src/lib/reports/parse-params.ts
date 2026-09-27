import type { AppointmentStatus, LeadSource } from "@/generated/prisma/client";
import { resolveDateRange } from "@/lib/reports/date-range";
import type { DatePreset, ReportFilters } from "@/lib/reports/types";

const PRESETS = new Set<DatePreset>([
  "today",
  "yesterday",
  "this_week",
  "this_month",
  "last_month",
  "last_3_months",
  "this_year",
  "custom",
]);

const APPOINTMENT_STATUSES = new Set<string>([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

const LEAD_SOURCES = new Set<string>([
  "WEBSITE",
  "GOOGLE",
  "INSTAGRAM",
  "FACEBOOK",
  "WHATSAPP",
  "REFERRAL",
  "WALK_IN",
  "OTHER",
]);

export function parseReportFilters(searchParams: URLSearchParams): ReportFilters {
  const rawPreset = searchParams.get("preset") ?? "this_month";
  const preset = PRESETS.has(rawPreset as DatePreset) ? (rawPreset as DatePreset) : "this_month";
  const fromParam = searchParams.get("from") ?? undefined;
  const toParam = searchParams.get("to") ?? undefined;
  const { from, to } = resolveDateRange(preset, fromParam, toParam);

  const branchId = searchParams.get("branchId")?.trim() || undefined;
  const doctorId = searchParams.get("doctorId")?.trim() || undefined;
  const serviceId = searchParams.get("serviceId")?.trim() || undefined;

  const statusRaw = searchParams.get("appointmentStatus")?.trim();
  const appointmentStatus =
    statusRaw && APPOINTMENT_STATUSES.has(statusRaw)
      ? (statusRaw as AppointmentStatus)
      : undefined;

  const sourceRaw = searchParams.get("leadSource")?.trim();
  const leadSource =
    sourceRaw && LEAD_SOURCES.has(sourceRaw) ? (sourceRaw as LeadSource) : undefined;

  return {
    preset,
    from,
    to,
    branchId,
    doctorId,
    serviceId,
    appointmentStatus,
    leadSource,
  };
}

export function filtersToQuery(filters: ReportFilters): string {
  const p = new URLSearchParams();
  p.set("preset", filters.preset);
  if (filters.preset === "custom") {
    p.set("from", filters.from.toISOString().slice(0, 10));
    p.set("to", filters.to.toISOString().slice(0, 10));
  }
  if (filters.branchId) p.set("branchId", filters.branchId);
  if (filters.doctorId) p.set("doctorId", filters.doctorId);
  if (filters.serviceId) p.set("serviceId", filters.serviceId);
  if (filters.appointmentStatus) p.set("appointmentStatus", filters.appointmentStatus);
  if (filters.leadSource) p.set("leadSource", filters.leadSource);
  return p.toString();
}
