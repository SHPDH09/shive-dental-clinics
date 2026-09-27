import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer, getAdminSupabaseClient } from "@/lib/supabase/data-client";

export type PublicHeroSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
};

export async function getPublicHeroSlides(): Promise<PublicHeroSlide[]> {
  try {
    if (canUseSupabaseDataLayer()) {
      const sb = await getAdminSupabaseClient();
      const { data, error } = await sb
        .from("HeroSlide")
        .select("id, title, subtitle, imageUrl, sortOrder, enabled")
        .eq("enabled", true)
        .order("sortOrder", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id as string,
        title: r.title as string,
        subtitle: (r.subtitle as string | null) ?? null,
        imageUrl: r.imageUrl as string,
      }));
    }

    const rows = await prisma.heroSlide.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, subtitle: true, imageUrl: true },
    });
    return rows;
  } catch {
    return [];
  }
}
