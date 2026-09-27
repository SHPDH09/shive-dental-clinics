import { requireAdminSession } from "@/lib/api-auth";
import { crudById } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseDelete, supabaseUpdate } from "@/lib/supabase/crud";
import { galleryMediaSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = galleryMediaSchema.partial();

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("media", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const row: Record<string, unknown> = { ...data };
  if (data.description !== undefined) {
    row.description = data.description?.trim() || null;
  }

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseUpdate("media", id, row);
      return NextResponse.json(item);
    }

    const item = await prisma.media.update({ where: { id }, data: row });
    return NextResponse.json(item);
  } catch (e) {
    console.error("PATCH media:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  try {
    if (canUseSupabaseDataLayer()) {
      await supabaseDelete("media", id);
      return NextResponse.json({ success: true });
    }

    await prisma.media.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
