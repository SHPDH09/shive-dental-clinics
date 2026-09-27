import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import type { PublicVideo } from "@/lib/public-video-types";

export type { PublicVideo } from "@/lib/public-video-types";
export { formatDuration } from "@/lib/public-video-types";

function mapVideo(row: Record<string, unknown>): PublicVideo {
  return {
    id: String(row.id),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    mediaUrl: String(row.mediaUrl),
    thumbnailUrl: (row.thumbnailUrl as string | null) ?? null,
    category: String(row.category),
    durationSeconds: row.durationSeconds != null ? Number(row.durationSeconds) : null,
    viewCount: Number(row.viewCount ?? 0),
    createdAt: new Date(String(row.createdAt)),
  };
}

const publicWhere = {
  mediaType: "VIDEO" as const,
  status: "PUBLISHED" as const,
  isPublic: true,
};

async function fetchVideosSupabase(take: number) {
  const sb = createSupabaseServiceClient();
  const { data, error } = await sb
    .from("Media")
    .select("*")
    .eq("mediaType", "VIDEO")
    .eq("status", "PUBLISHED")
    .eq("isPublic", true)
    .order("createdAt", { ascending: false })
    .limit(take);
  if (error) throw error;
  return (data ?? []).map((r) => mapVideo(r as Record<string, unknown>));
}

export async function getPublicVideos(take = 24): Promise<PublicVideo[]> {
  try {
    const rows = await prisma.media.findMany({
      where: publicWhere,
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows.map((r) => mapVideo(r as unknown as Record<string, unknown>));
  } catch {
    if (!getSupabaseSecretKey()) return [];
    try {
      return await fetchVideosSupabase(take);
    } catch {
      return [];
    }
  }
}

export async function getPublicVideoById(id: string): Promise<PublicVideo | null> {
  try {
    const row = await prisma.media.findFirst({
      where: { id, ...publicWhere },
    });
    return row ? mapVideo(row as unknown as Record<string, unknown>) : null;
  } catch {
    if (!getSupabaseSecretKey()) return null;
    try {
      const sb = createSupabaseServiceClient();
      const { data, error } = await sb
        .from("Media")
        .select("*")
        .eq("id", id)
        .eq("mediaType", "VIDEO")
        .eq("status", "PUBLISHED")
        .eq("isPublic", true)
        .maybeSingle();
      if (error || !data) return null;
      return mapVideo(data as Record<string, unknown>);
    } catch {
      return null;
    }
  }
}

export async function getRelatedVideos(category: string, excludeId: string, take = 4) {
  const all = await getPublicVideos(48);
  return all.filter((v) => v.category === category && v.id !== excludeId).slice(0, take);
}
