import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import type { PublicService, ServiceFaq } from "@/lib/public-service-types";

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function parseFaqs(value: unknown): ServiceFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const q = (item as { question?: string }).question;
      const a = (item as { answer?: string }).answer;
      if (!q?.trim() || !a?.trim()) return null;
      return { question: q.trim(), answer: a.trim() };
    })
    .filter((x): x is ServiceFaq => x != null);
}

function priceToString(price: unknown): string | null {
  if (price == null || price === "") return null;
  return String(price);
}

export function mapPublicService(
  row: Record<string, unknown>,
  category?: { name: string; slug: string } | null,
): PublicService {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description),
    shortDesc: (row.shortDesc as string | null) ?? null,
    whatIsTreatment: (row.whatIsTreatment as string | null) ?? null,
    image: (row.image as string | null) ?? null,
    icon: (row.icon as string | null) ?? null,
    categoryId: (row.categoryId as string | null) ?? null,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    treatmentDuration: (row.treatmentDuration as string | null) ?? null,
    price: priceToString(row.price),
    hidePrice: Boolean(row.hidePrice),
    benefits: parseStringArray(row.benefits),
    treatmentSteps: parseStringArray(row.treatmentSteps),
    faqs: parseFaqs(row.faqs),
    featured: Boolean(row.featured),
    enabled: row.enabled !== false,
    sortOrder: Number(row.sortOrder ?? 0),
    createdAt: new Date(String(row.createdAt ?? new Date().toISOString())),
    updatedAt: new Date(String(row.updatedAt ?? row.createdAt ?? new Date().toISOString())),
  };
}

async function fetchServicesSupabase(): Promise<PublicService[]> {
  const sb = createSupabaseServiceClient();
  const [{ data: services, error }, { data: categories }] = await Promise.all([
    sb.from("Service").select("*").eq("enabled", true).order("sortOrder", { ascending: true }),
    sb.from("ServiceCategory").select("id,name,slug"),
  ]);
  if (error) throw error;
  const catMap = new Map(
    (categories ?? []).map((c) => [String(c.id), { name: String(c.name), slug: String(c.slug) }]),
  );
  return (services ?? []).map((r) =>
    mapPublicService(r as Record<string, unknown>, catMap.get(String(r.categoryId)) ?? null),
  );
}

export async function getPublicServicesList(): Promise<PublicService[]> {
  try {
    const [rows, catMap] = await Promise.all([
      prisma.service.findMany({
        where: { enabled: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: { category: true },
      }),
      Promise.resolve(null as Map<string, { name: string; slug: string }> | null),
    ]);
    void catMap;
    return rows.map((r) =>
      mapPublicService(r as unknown as Record<string, unknown>, r.category ?? null),
    );
  } catch {
    if (!getSupabaseSecretKey()) return [];
    try {
      return await fetchServicesSupabase();
    } catch {
      return [];
    }
  }
}

export async function getPublicServiceBySlug(slug: string): Promise<PublicService | null> {
  try {
    const row = await prisma.service.findFirst({
      where: { slug, enabled: true },
      include: { category: true },
    });
    if (!row) return null;
    return mapPublicService(row as unknown as Record<string, unknown>, row.category ?? null);
  } catch {
    if (!getSupabaseSecretKey()) return null;
    try {
      const sb = createSupabaseServiceClient();
      const { data, error } = await sb
        .from("Service")
        .select("*")
        .eq("slug", slug)
        .eq("enabled", true)
        .maybeSingle();
      if (error || !data) return null;
      let category: { name: string; slug: string } | null = null;
      if (data.categoryId) {
        const { data: cat } = await sb
          .from("ServiceCategory")
          .select("name,slug")
          .eq("id", data.categoryId)
          .maybeSingle();
        if (cat) category = { name: String(cat.name), slug: String(cat.slug) };
      }
      return mapPublicService(data as Record<string, unknown>, category);
    } catch {
      return null;
    }
  }
}

export type PublicServicePickerOption = { id: string; name: string; slug: string };

export async function getPublicServicePickerOptions(): Promise<PublicServicePickerOption[]> {
  try {
    const rows = await prisma.service.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    });
    return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug }));
  } catch {
    if (!getSupabaseSecretKey()) return [];
    try {
      const sb = createSupabaseServiceClient();
      const { data, error } = await sb
        .from("Service")
        .select("id,name,slug")
        .eq("enabled", true)
        .order("sortOrder", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: String(r.id),
        name: String(r.name),
        slug: String(r.slug),
      }));
    } catch {
      return [];
    }
  }
}

export async function getFeaturedPublicServices(limit = 6): Promise<PublicService[]> {
  try {
    let rows = await prisma.service.findMany({
      where: { enabled: true, featured: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
      include: { category: true },
    });
    if (rows.length === 0) {
      rows = await prisma.service.findMany({
        where: { enabled: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: limit,
        include: { category: true },
      });
    }
    return rows.map((r) =>
      mapPublicService(r as unknown as Record<string, unknown>, r.category ?? null),
    );
  } catch {
    if (!getSupabaseSecretKey()) return [];
    try {
      const sb = createSupabaseServiceClient();
      let { data: services, error } = await sb
        .from("Service")
        .select("*")
        .eq("enabled", true)
        .eq("featured", true)
        .order("sortOrder", { ascending: true })
        .limit(limit);
      if (error) throw error;
      if (!services?.length) {
        const fallback = await sb
          .from("Service")
          .select("*")
          .eq("enabled", true)
          .order("sortOrder", { ascending: true })
          .limit(limit);
        services = fallback.data ?? [];
      }
      const { data: categories } = await sb.from("ServiceCategory").select("id,name,slug");
      const catMap = new Map(
        (categories ?? []).map((c) => [String(c.id), { name: String(c.name), slug: String(c.slug) }]),
      );
      return (services ?? []).map((r) =>
        mapPublicService(r as Record<string, unknown>, catMap.get(String(r.categoryId)) ?? null),
      );
    } catch {
      return [];
    }
  }
}
