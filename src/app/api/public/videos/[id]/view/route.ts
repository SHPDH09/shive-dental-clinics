import { prisma } from "@/lib/prisma";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    if (getSupabaseSecretKey()) {
      const sb = createSupabaseServiceClient();
      const { data: current } = await sb
        .from("Media")
        .select("viewCount")
        .eq("id", id)
        .eq("mediaType", "VIDEO")
        .eq("isPublic", true)
        .eq("status", "PUBLISHED")
        .maybeSingle();
      if (!current) return NextResponse.json({ ok: false }, { status: 404 });
      const next = (Number(current.viewCount) || 0) + 1;
      await sb.from("Media").update({ viewCount: next }).eq("id", id);
      return NextResponse.json({ ok: true, viewCount: next });
    }

    const updated = await prisma.media.updateMany({
      where: {
        id,
        mediaType: "VIDEO",
        isPublic: true,
        status: "PUBLISHED",
      },
      data: { viewCount: { increment: 1 } },
    });
    if (updated.count === 0) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
