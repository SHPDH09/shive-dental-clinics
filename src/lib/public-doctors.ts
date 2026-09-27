import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import {
  DEFAULT_WEEKLY_SCHEDULE,
  formatConsultationSummary,
  parseWeeklySchedule,
} from "@/lib/doctor-schedule";
import type { PublicDoctor } from "@/lib/public-doctor-types";

function parseExpertise(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

export function mapPublicDoctor(row: Record<string, unknown>): PublicDoctor {
  const weeklySchedule = parseWeeklySchedule(row.weeklySchedule);
  const consultationHours =
    (row.consultationHours as string | null)?.trim() ||
    formatConsultationSummary(weeklySchedule);

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    qualification: String(row.qualification),
    specialization: String(row.specialization),
    experienceYears: Number(row.experienceYears ?? 0),
    bio: String(row.bio),
    summary: (row.summary as string | null) ?? null,
    image: (row.image as string | null) ?? null,
    areasOfExpertise: parseExpertise(row.areasOfExpertise),
    languagesSpoken: (row.languagesSpoken as string | null) ?? null,
    weeklySchedule,
    consultationHours,
    featured: Boolean(row.featured),
    sortOrder: Number(row.sortOrder ?? 0),
    updatedAt: new Date(String(row.updatedAt ?? row.createdAt ?? new Date().toISOString())),
  };
}

async function fetchDoctorsSupabase(): Promise<PublicDoctor[]> {
  const sb = createSupabaseServiceClient();
  const { data, error } = await sb
    .from("Doctor")
    .select("*")
    .eq("enabled", true)
    .order("sortOrder", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapPublicDoctor(r as Record<string, unknown>));
}

export async function getPublicDoctorsList(): Promise<PublicDoctor[]> {
  try {
    const rows = await prisma.doctor.findMany({
      where: { enabled: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((r) => mapPublicDoctor(r as unknown as Record<string, unknown>));
  } catch {
    if (!getSupabaseSecretKey()) return [];
    try {
      return await fetchDoctorsSupabase();
    } catch {
      return [];
    }
  }
}

export async function getPublicDoctorBySlug(slug: string): Promise<PublicDoctor | null> {
  try {
    const row = await prisma.doctor.findFirst({ where: { slug, enabled: true } });
    if (!row) return null;
    return mapPublicDoctor(row as unknown as Record<string, unknown>);
  } catch {
    if (!getSupabaseSecretKey()) return null;
    try {
      const sb = createSupabaseServiceClient();
      const { data, error } = await sb
        .from("Doctor")
        .select("*")
        .eq("slug", slug)
        .eq("enabled", true)
        .maybeSingle();
      if (error || !data) return null;
      return mapPublicDoctor(data as Record<string, unknown>);
    } catch {
      return null;
    }
  }
}

export async function getFeaturedPublicDoctor(): Promise<PublicDoctor | null> {
  const all = await getPublicDoctorsList();
  return all.find((d) => d.featured) ?? all[0] ?? null;
}

export async function getFeaturedPublicDoctors(limit = 6): Promise<PublicDoctor[]> {
  const all = await getPublicDoctorsList();
  const featured = all.filter((d) => d.featured);
  if (featured.length > 0) return featured.slice(0, limit);
  return all.slice(0, limit);
}

export { DEFAULT_WEEKLY_SCHEDULE };
