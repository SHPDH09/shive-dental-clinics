import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { supabaseDelete, supabaseUpdate } from "@/lib/supabase/crud";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { error } = await requirePermission("settings", "edit");
  if (error) return error;

  const { id } = await ctx.params;
  const data = await req.json();

  try {
    if (useSupabaseCrud()) {
      const item = await supabaseUpdate("heroSlide", id, data);
      return NextResponse.json(item);
    }
    const item = await prisma.heroSlide.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (e) {
    console.error("PATCH hero-slide:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { error } = await requirePermission("settings", "edit");
  if (error) return error;

  const { id } = await ctx.params;
  try {
    if (useSupabaseCrud()) {
      await supabaseDelete("heroSlide", id);
      return NextResponse.json({ ok: true });
    }
    await prisma.heroSlide.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE hero-slide:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
