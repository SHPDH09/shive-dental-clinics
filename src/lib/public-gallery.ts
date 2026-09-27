import { prisma } from "@/lib/prisma";
import type { MediaType } from "@/generated/prisma/client";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey } from "@/lib/supabase/env";

export type PublicGalleryItem = {
  id: string;
  title: string;
  description: string | null;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  category: string;
  createdAt: Date;
};

function mapRow(row: Record<string, unknown>): PublicGalleryItem {
  return {
    id: String(row.id),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    mediaType: row.mediaType as MediaType,
    mediaUrl: String(row.mediaUrl),
    category: String(row.category ?? "clinic"),
    createdAt: new Date(String(row.createdAt)),
  };
}

async function fetchFromSupabase(take: number) {
  const sb = createSupabaseServiceClient();
  const { data, error } = await sb
    .from("Media")
    .select("*")
    .eq("mediaType", "IMAGE")
    .eq("status", "PUBLISHED")
    .eq("isPublic", true)
    .order("createdAt", { ascending: false })
    .limit(take);
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getPublicGalleryItems(take = 48): Promise<PublicGalleryItem[]> {
  try {
    const rows = await prisma.media.findMany({
      where: { mediaType: "IMAGE", status: "PUBLISHED", isPublic: true },
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows;
  } catch {
    if (!getSupabaseSecretKey()) return [];
    try {
      return await fetchFromSupabase(take);
    } catch {
      return [];
    }
  }
}
