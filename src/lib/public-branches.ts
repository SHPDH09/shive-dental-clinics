import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import {
  DEFAULT_WEEKLY_SCHEDULE,
  formatConsultationSummary,
  parseWeeklySchedule,
} from "@/lib/doctor-schedule";
import type { PublicBranch } from "@/lib/public-branch-types";

function parseIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.length > 0);
}

function buildFullAddress(row: {
  address: string;
  city: string;
  state?: string | null;
  pinCode?: string | null;
}): string {
  const parts = [row.address, row.city, row.state, row.pinCode].filter(Boolean);
  return parts.join(", ");
}

async function resolveDoctors(ids: string[]) {
  if (ids.length === 0) return [];
  try {
    const rows = await prisma.doctor.findMany({
      where: { id: { in: ids }, enabled: true },
      select: { id: true, name: true, slug: true },
    });
    return rows;
  } catch {
    if (!getSupabaseSecretKey()) return [];
    const sb = createSupabaseServiceClient();
    const { data } = await sb
      .from("Doctor")
      .select("id,name,slug")
      .in("id", ids)
      .eq("enabled", true);
    return (data ?? []).map((d) => ({ id: String(d.id), name: String(d.name), slug: String(d.slug) }));
  }
}

async function resolveServices(ids: string[]) {
  if (ids.length === 0) return [];
  try {
    const rows = await prisma.service.findMany({
      where: { id: { in: ids }, enabled: true },
      select: { id: true, name: true, slug: true },
    });
    return rows;
  } catch {
    if (!getSupabaseSecretKey()) return [];
    const sb = createSupabaseServiceClient();
    const { data } = await sb
      .from("Service")
      .select("id,name,slug")
      .in("id", ids)
      .eq("enabled", true);
    return (data ?? []).map((s) => ({ id: String(s.id), name: String(s.name), slug: String(s.slug) }));
  }
}

export async function mapPublicBranch(row: Record<string, unknown>): Promise<PublicBranch> {
  const weeklySchedule = parseWeeklySchedule(row.weeklySchedule);
  const doctorIds = parseIdList(row.doctorIds);
  const serviceIds = parseIdList(row.serviceIds);
  const [doctors, services] = await Promise.all([
    resolveDoctors(doctorIds),
    resolveServices(serviceIds),
  ]);

  const address = String(row.address ?? row.location ?? "");
  const city = String(row.city ?? "");
  const phone = String(row.phone ?? "");
  const whatsapp = String(row.whatsapp ?? row.phone ?? "");

  const legacyHours =
    row.openTime && row.closeTime
      ? `${row.openTime} – ${row.closeTime}${row.offDays ? ` · Off: ${row.offDays}` : ""}`
      : null;

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    image: (row.image as string | null) ?? null,
    address,
    city,
    state: (row.state as string | null) ?? null,
    pinCode: (row.pinCode as string | null) ?? null,
    fullAddress: buildFullAddress({
      address,
      city,
      state: row.state as string | null,
      pinCode: row.pinCode as string | null,
    }),
    phone,
    whatsapp,
    mapUrl: (row.mapUrl as string | null) ?? null,
    mapEmbedUrl: (row.mapEmbedUrl as string | null) ?? null,
    latitude: (row.latitude as string | null) ?? null,
    longitude: (row.longitude as string | null) ?? null,
    openingHoursSummary:
      legacyHours ?? formatConsultationSummary(weeklySchedule) ?? "See branch page for hours",
    weeklySchedule,
    doctorIds,
    serviceIds,
    doctors,
    services,
    featured: Boolean(row.featured),
    updatedAt: new Date(String(row.updatedAt ?? row.createdAt ?? new Date().toISOString())),
  };
}

const publicBranchWhere = {
  published: true,
  status: "ACTIVE" as const,
};

async function fetchBranchesSupabase(): Promise<PublicBranch[]> {
  const sb = createSupabaseServiceClient();
  const { data, error } = await sb
    .from("Branch")
    .select("*")
    .eq("published", true)
    .eq("status", "ACTIVE")
    .order("sortOrder", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map((r) => mapPublicBranch(r as Record<string, unknown>)));
}

export async function getPublicBranchesList(): Promise<PublicBranch[]> {
  try {
    const rows = await prisma.branch.findMany({
      where: publicBranchWhere,
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    });
    return Promise.all(rows.map((r) => mapPublicBranch(r as unknown as Record<string, unknown>)));
  } catch {
    if (!getSupabaseSecretKey()) return [];
    try {
      return await fetchBranchesSupabase();
    } catch {
      return [];
    }
  }
}

export async function getPublicBranchBySlug(slug: string): Promise<PublicBranch | null> {
  try {
    const row = await prisma.branch.findFirst({
      where: { slug, ...publicBranchWhere },
    });
    if (!row) return null;
    return mapPublicBranch(row as unknown as Record<string, unknown>);
  } catch {
    if (!getSupabaseSecretKey()) return null;
    try {
      const sb = createSupabaseServiceClient();
      const { data, error } = await sb
        .from("Branch")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .eq("status", "ACTIVE")
        .maybeSingle();
      if (error || !data) return null;
      return mapPublicBranch(data as Record<string, unknown>);
    } catch {
      return null;
    }
  }
}

export {
  searchPublicBranches,
  branchDirectionsUrl,
  branchOpeningLines,
} from "@/lib/public-branch-utils";

export { DEFAULT_WEEKLY_SCHEDULE };
