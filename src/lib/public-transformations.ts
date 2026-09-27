import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey } from "@/lib/supabase/env";

export type PublicTransformation = {
  id: string;
  treatment: string;
  category: string;
  beforeImage: string;
  afterImage: string;
  description: string | null;
  treatmentDuration: string | null;
  caseDate: Date;
  verifiedCase: boolean;
  featured: boolean;
};

const publicWhere = {
  status: "PUBLISHED" as const,
  isPublic: true,
  consentConfirmed: true,
};

function mapRow(row: Record<string, unknown>): PublicTransformation {
  return {
    id: String(row.id),
    treatment: String(row.treatment),
    category: String(row.category ?? "cosmetic-dentistry"),
    beforeImage: String(row.beforeImage),
    afterImage: String(row.afterImage),
    description: (row.description as string | null) ?? null,
    treatmentDuration: (row.treatmentDuration as string | null) ?? null,
    caseDate: new Date(String(row.caseDate ?? row.createdAt)),
    verifiedCase: row.verifiedCase !== false,
    featured: Boolean(row.featured),
  };
}

async function fetchSupabase(take: number, featuredOnly: boolean) {
  const sb = createSupabaseServiceClient();
  let query = sb
    .from("BeforeAfter")
    .select("*")
    .eq("status", "PUBLISHED")
    .eq("isPublic", true)
    .eq("consentConfirmed", true)
    .order("sortOrder", { ascending: true })
    .limit(take);
  if (featuredOnly) query = query.eq("featured", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function getPublicTransformations(
  take = 24,
  options?: { featuredOnly?: boolean },
): Promise<PublicTransformation[]> {
  const featuredOnly = options?.featuredOnly ?? false;
  try {
    const rows = await prisma.beforeAfter.findMany({
      where: {
        ...publicWhere,
        ...(featuredOnly ? { featured: true } : {}),
      },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { caseDate: "desc" }],
      take,
    });
    return rows.map((r) => mapRow(r as unknown as Record<string, unknown>));
  } catch {
    if (!getSupabaseSecretKey()) return [];
    try {
      return await fetchSupabase(take, featuredOnly);
    } catch {
      return [];
    }
  }
}
