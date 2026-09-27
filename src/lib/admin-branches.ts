import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type AdminBranchListOptions = {
  page: number;
  limit: number;
  q?: string;
  city?: string;
  published?: boolean;
  sort?: "newest" | "name" | "city";
};

export async function listAdminBranches(options: AdminBranchListOptions) {
  const skip = (options.page - 1) * options.limit;

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    let query = sb.from("Branch").select("*", { count: "exact" });
    if (options.city) query = query.ilike("city", `%${options.city}%`);
    if (options.published === true) query = query.eq("published", true);
    if (options.published === false) query = query.eq("published", false);
    if (options.q) {
      query = query.or(`name.ilike.%${options.q}%,address.ilike.%${options.q}%,city.ilike.%${options.q}%`);
    }
    const orderCol =
      options.sort === "city" ? "city" : options.sort === "name" ? "name" : "createdAt";
    query = query.order(orderCol, { ascending: options.sort === "name" || options.sort === "city" }).range(skip, skip + options.limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { items: data ?? [], total: count ?? 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (options.city) where.city = { contains: options.city, mode: "insensitive" };
  if (options.published === true) where.published = true;
  if (options.published === false) where.published = false;
  if (options.q) {
    where.OR = [
      { name: { contains: options.q, mode: "insensitive" } },
      { address: { contains: options.q, mode: "insensitive" } },
      { city: { contains: options.q, mode: "insensitive" } },
    ];
  }

  let orderBy: { createdAt?: "desc"; name?: "asc"; city?: "asc" } = { createdAt: "desc" };
  if (options.sort === "name") orderBy = { name: "asc" };
  if (options.sort === "city") orderBy = { city: "asc" };

  const [items, total] = await Promise.all([
    prisma.branch.findMany({ where, skip, take: options.limit, orderBy }),
    prisma.branch.count({ where }),
  ]);
  return { items, total };
}

export function branchPayloadFromInput(data: {
  name: string;
  image?: string;
  address: string;
  city: string;
  state?: string;
  pinCode?: string;
  phone: string;
  whatsapp?: string;
  mapUrl?: string;
  mapEmbedUrl?: string;
  latitude?: string;
  longitude?: string;
  weeklySchedule?: unknown;
  openTime?: string;
  closeTime?: string;
  offDays?: string;
  doctorIds?: string[];
  serviceIds?: string[];
  featured?: boolean;
  published?: boolean;
  status?: "ACTIVE" | "CLOSED";
  sortOrder?: number;
}) {
  return {
    name: data.name,
    image: data.image || null,
    address: data.address,
    city: data.city,
    state: data.state?.trim() || null,
    pinCode: data.pinCode?.trim() || null,
    location: data.address,
    phone: data.phone,
    whatsapp: data.whatsapp?.trim() || data.phone,
    mapUrl: data.mapUrl?.trim() || null,
    mapEmbedUrl: data.mapEmbedUrl?.trim() || null,
    latitude: data.latitude?.trim() || null,
    longitude: data.longitude?.trim() || null,
    weeklySchedule: data.weeklySchedule ?? null,
    openTime: data.openTime ?? "10:00 AM",
    closeTime: data.closeTime ?? "7:00 PM",
    offDays: data.offDays?.trim() || null,
    doctorIds: data.doctorIds ?? [],
    serviceIds: data.serviceIds ?? [],
    featured: data.featured ?? false,
    published: data.published ?? true,
    status: data.status ?? "ACTIVE",
    sortOrder: data.sortOrder ?? 0,
  };
}
