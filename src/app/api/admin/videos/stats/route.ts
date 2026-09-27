import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer, getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    if (canUseSupabaseDataLayer()) {
      const sb = await getAdminSupabaseClient();
      const { data, error: listError } = await sb
        .from("Media")
        .select("status, isPublic, viewCount")
        .eq("mediaType", "VIDEO");
      if (listError) throw listError;
      const rows = data ?? [];
      return NextResponse.json({
        total: rows.length,
        published: rows.filter((r) => r.status === "PUBLISHED").length,
        drafts: rows.filter((r) => r.status === "DRAFT").length,
        private: rows.filter((r) => !r.isPublic).length,
        totalViews: rows.reduce((sum, r) => sum + (Number(r.viewCount) || 0), 0),
      });
    }

    const rows = await prisma.media.findMany({
      where: { mediaType: "VIDEO" },
      select: { status: true, isPublic: true, viewCount: true },
    });

    return NextResponse.json({
      total: rows.length,
      published: rows.filter((r) => r.status === "PUBLISHED").length,
      drafts: rows.filter((r) => r.status === "DRAFT").length,
      private: rows.filter((r) => !r.isPublic).length,
      totalViews: rows.reduce((sum, r) => sum + r.viewCount, 0),
    });
  } catch (e) {
    console.error("video stats:", e);
    return NextResponse.json({
      total: 0,
      published: 0,
      drafts: 0,
      private: 0,
      totalViews: 0,
    });
  }
}
