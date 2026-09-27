import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type AdminServiceListOptions = {
  page: number;
  limit: number;
  q?: string;
  categoryId?: string;
  enabled?: boolean;
  sort?: "newest" | "oldest";
};

function serviceListOrder(sort: AdminServiceListOptions["sort"]) {
  return sort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };
}

export async function listAdminServices(options: AdminServiceListOptions) {
  const skip = (options.page - 1) * options.limit;
  const order = serviceListOrder(options.sort);

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    let query = sb.from("Service").select("*", { count: "exact" });

    if (options.categoryId) query = query.eq("categoryId", options.categoryId);
    if (options.enabled === true) query = query.eq("enabled", true);
    if (options.enabled === false) query = query.eq("enabled", false);
    if (options.q) {
      query = query.or(`name.ilike.%${options.q}%,slug.ilike.%${options.q}%`);
    }

    query = query
      .order("createdAt", { ascending: options.sort === "oldest" })
      .range(skip, skip + options.limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const categoryIds = [...new Set((data ?? []).map((r) => r.categoryId).filter(Boolean))];
    let categories: Record<string, { name: string; slug: string }> = {};
    if (categoryIds.length > 0) {
      const { data: cats } = await sb.from("ServiceCategory").select("id,name,slug").in("id", categoryIds);
      categories = Object.fromEntries((cats ?? []).map((c) => [c.id, { name: c.name, slug: c.slug }]));
    }

    const items = (data ?? []).map((row) => ({
      ...row,
      category: row.categoryId ? categories[row.categoryId as string] ?? null : null,
    }));

    return { items, total: count ?? 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (options.categoryId) where.categoryId = options.categoryId;
  if (options.enabled === true) where.enabled = true;
  if (options.enabled === false) where.enabled = false;
  if (options.q) {
    where.OR = [
      { name: { contains: options.q, mode: "insensitive" } },
      { slug: { contains: options.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: options.limit,
      orderBy: order,
      include: { category: { select: { name: true, slug: true } } },
    }),
    prisma.service.count({ where }),
  ]);

  return { items, total };
}

export function servicePayloadFromInput(data: {
  name: string;
  slug?: string;
  description: string;
  shortDesc?: string;
  whatIsTreatment?: string;
  image?: string;
  icon?: string;
  categoryId?: string;
  treatmentDuration?: string;
  price?: string;
  hidePrice?: boolean;
  benefits?: string[];
  treatmentSteps?: string[];
  faqs?: { question: string; answer: string }[];
  featured?: boolean;
  enabled?: boolean;
  sortOrder?: number;
}) {
  return {
    name: data.name,
    description: data.description,
    shortDesc: data.shortDesc ?? null,
    whatIsTreatment: data.whatIsTreatment?.trim() || null,
    image: data.image || null,
    icon: data.icon?.trim() || null,
    categoryId: data.categoryId || null,
    treatmentDuration: data.treatmentDuration?.trim() || null,
    price: data.price?.trim() ? data.price.trim() : null,
    hidePrice: data.hidePrice ?? false,
    benefits: data.benefits ?? [],
    treatmentSteps: data.treatmentSteps ?? [],
    faqs: data.faqs ?? [],
    featured: data.featured ?? false,
    enabled: data.enabled ?? true,
    sortOrder: data.sortOrder ?? 0,
  };
}
