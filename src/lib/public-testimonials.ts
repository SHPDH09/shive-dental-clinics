import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey } from "@/lib/supabase/env";

export type PublicTestimonial = {
  id: string;
  patientName: string;
  patientImage: string | null;
  rating: number;
  testimonial: string;
  treatment: string | null;
  testimonialDate: Date;
  verifiedPatient: boolean;
};

function mapRow(row: Record<string, unknown>): PublicTestimonial {
  return {
    id: String(row.id),
    patientName: String(row.patientName),
    patientImage: (row.patientImage as string | null) ?? null,
    rating: Number(row.rating ?? 5),
    testimonial: String(row.testimonial),
    treatment: (row.treatment as string | null) ?? null,
    testimonialDate: new Date(String(row.testimonialDate ?? row.createdAt)),
    verifiedPatient: row.verifiedPatient !== false,
  };
}

async function fetchFromSupabase(take: number) {
  const sb = createSupabaseServiceClient();
  const { data, error } = await sb
    .from("Testimonial")
    .select("*")
    .eq("status", "PUBLISHED")
    .order("testimonialDate", { ascending: false })
    .limit(take);
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getPublicTestimonials(take = 12): Promise<PublicTestimonial[]> {
  try {
    const rows = await prisma.testimonial.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { testimonialDate: "desc" },
      take,
    });
    return rows.map((r) => ({
      ...r,
      verifiedPatient: (r as { verifiedPatient?: boolean }).verifiedPatient ?? true,
    }));
  } catch {
    if (!getSupabaseSecretKey()) return [];
    try {
      return await fetchFromSupabase(take);
    } catch {
      return [];
    }
  }
}
