import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer, getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { supabaseCreate } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    if (canUseSupabaseDataLayer()) {
      const sb = await getAdminSupabaseClient();
      const { data, error: listError, count } = await sb
        .from("HeroStat")
        .select("*", { count: "exact" })
        .order("sortOrder", { ascending: true })
        .range(from, to);
      if (listError) throw listError;
      return NextResponse.json({ items: data ?? [], total: count ?? 0, page, limit });
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.heroStat.findMany({
        skip,
        take: limit,
        orderBy: { sortOrder: "asc" },
      }),
      prisma.heroStat.count(),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error("GET /api/admin/hero-stats:", e);
    return NextResponse.json({ items: [], total: 0, page, limit });
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const data = await req.json();

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseCreate("heroStat", data);
      return NextResponse.json(item);
    }

    const item = await prisma.heroStat.create({ data });
    return NextResponse.json(item);
  } catch (e) {
    console.error("POST /api/admin/hero-stats:", e);
    return NextResponse.json({ error: "Could not create stat" }, { status: 500 });
  }
}
