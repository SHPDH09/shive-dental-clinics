import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer, getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { supabaseCreate } from "@/lib/supabase/crud";
import { videoMediaSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const visibility = searchParams.get("visibility");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    if (canUseSupabaseDataLayer()) {
      const sb = await getAdminSupabaseClient();
      let query = sb.from("Media").select("*", { count: "exact" }).eq("mediaType", "VIDEO");
      if (category) query = query.eq("category", category);
      if (status) query = query.eq("status", status);
      if (visibility === "public") query = query.eq("isPublic", true);
      if (visibility === "private") query = query.eq("isPublic", false);
      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
      }
      const { data, error: listError, count } = await query
        .order("createdAt", { ascending: false })
        .range(from, to);
      if (listError) throw listError;
      return NextResponse.json({ items: data ?? [], total: count ?? 0, page, limit });
    }

    const where: Record<string, unknown> = { mediaType: "VIDEO" };
    if (category) where.category = category;
    if (status) where.status = status;
    if (visibility === "public") where.isPublic = true;
    if (visibility === "private") where.isPublic = false;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip: from,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.media.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error("GET /api/admin/videos:", e);
    return NextResponse.json({ items: [], total: 0, page, limit });
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = videoMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const createdAt = data.uploadDate ? new Date(data.uploadDate) : new Date();

  const payload = {
    title: data.title,
    description: data.description?.trim() || null,
    mediaType: "VIDEO" as const,
    mediaUrl: data.mediaUrl,
    thumbnailUrl: data.thumbnailUrl,
    category: data.category,
    durationSeconds: data.durationSeconds ?? null,
    isPublic: data.isPublic,
    status: data.status,
    viewCount: 0,
    createdAt: createdAt.toISOString(),
  };

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseCreate("media", payload);
      return NextResponse.json(item, { status: 201 });
    }

    const item = await prisma.media.create({
      data: {
        ...payload,
        createdAt,
        mediaType: "VIDEO",
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/videos:", e);
    return NextResponse.json({ error: "Could not save video" }, { status: 500 });
  }
}
