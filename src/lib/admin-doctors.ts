import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type AdminDoctorListOptions = {
  page: number;
  limit: number;
  q?: string;
  specialization?: string;
  enabled?: boolean;
  availableToday?: boolean;
  sort?: "experience" | "name" | "newest";
};

export async function listAdminDoctors(options: AdminDoctorListOptions) {
  const skip = (options.page - 1) * options.limit;

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    let query = sb.from("Doctor").select("*", { count: "exact" });

    if (options.specialization) {
      query = query.ilike("specialization", `%${options.specialization}%`);
    }
    if (options.enabled === true) query = query.eq("enabled", true);
    if (options.enabled === false) query = query.eq("enabled", false);
    if (options.q) {
      query = query.or(`name.ilike.%${options.q}%,specialization.ilike.%${options.q}%`);
    }

    const orderCol =
      options.sort === "experience" ? "experienceYears" : options.sort === "name" ? "name" : "createdAt";
    query = query.order(orderCol, { ascending: options.sort === "name" }).range(skip, skip + options.limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { items: data ?? [], total: count ?? 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (options.specialization) {
    where.specialization = { contains: options.specialization, mode: "insensitive" };
  }
  if (options.enabled === true) where.enabled = true;
  if (options.enabled === false) where.enabled = false;
  if (options.q) {
    where.OR = [
      { name: { contains: options.q, mode: "insensitive" } },
      { specialization: { contains: options.q, mode: "insensitive" } },
    ];
  }

  let orderBy: { experienceYears?: "desc" | "asc"; name?: "asc"; createdAt?: "desc" | "asc" } = {
    createdAt: "desc",
  };
  if (options.sort === "experience") orderBy = { experienceYears: "desc" };
  if (options.sort === "name") orderBy = { name: "asc" };

  const [items, total] = await Promise.all([
    prisma.doctor.findMany({ where, skip, take: options.limit, orderBy }),
    prisma.doctor.count({ where }),
  ]);

  return { items, total };
}

export function doctorPayloadFromInput(data: {
  name: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  summary?: string;
  image?: string;
  areasOfExpertise?: string[];
  languagesSpoken?: string;
  weeklySchedule?: unknown;
  consultationHours?: string;
  registrationNumber?: string;
  phone?: string;
  featured?: boolean;
  enabled?: boolean;
  sortOrder?: number;
}) {
  return {
    name: data.name,
    qualification: data.qualification,
    specialization: data.specialization,
    experienceYears: data.experienceYears,
    bio: data.bio,
    summary: data.summary ?? null,
    image: data.image ?? null,
    areasOfExpertise: data.areasOfExpertise ?? [],
    languagesSpoken: data.languagesSpoken?.trim() || null,
    weeklySchedule: data.weeklySchedule ?? null,
    consultationHours: data.consultationHours?.trim() || null,
    registrationNumber: data.registrationNumber?.trim() || null,
    phone: data.phone?.trim() || null,
    featured: data.featured ?? false,
    enabled: data.enabled ?? true,
    sortOrder: data.sortOrder ?? 0,
  };
}
