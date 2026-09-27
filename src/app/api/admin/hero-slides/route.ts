import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer, getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { supabaseCreate } from "@/lib/supabase/crud";
import { z } from "zod";
import { firstZodFieldError } from "@/lib/zod-api-error";
import { NextResponse } from "next/server";

const slideSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().min(1),
  sortOrder: z.number().optional(),
  enabled: z.boolean().optional(),
});

export async function GET(req: Request) {
  const { error } = await requirePermission("settings", "view");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));

  try {
    if (canUseSupabaseDataLayer()) {
      const sb = await getAdminSupabaseClient();
      const { data, error: listError } = await sb
        .from("HeroSlide")
        .select("*")
        .order("sortOrder", { ascending: true })
        .limit(limit);
      if (listError) throw listError;
      return NextResponse.json({ items: data ?? [] });
    }

    const items = await prisma.heroSlide.findMany({
      take: limit,
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET hero-slides:", e);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: Request) {
  const { error } = await requirePermission("settings", "edit");
  if (error) return error;

  const body = await req.json();
  const parsed = slideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodFieldError(parsed.error) }, { status: 400 });
  }

  const data = {
    title: parsed.data.title,
    subtitle: parsed.data.subtitle?.trim() || null,
    imageUrl: parsed.data.imageUrl,
    sortOrder: parsed.data.sortOrder ?? 0,
    enabled: parsed.data.enabled ?? true,
  };

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseCreate("heroSlide", data);
      return NextResponse.json(item, { status: 201 });
    }
    const item = await prisma.heroSlide.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST hero-slides:", e);
    return NextResponse.json({ error: "Could not create slide" }, { status: 400 });
  }
}
