import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseDelete, supabaseFindUnique, supabaseUpdate } from "@/lib/supabase/crud";
import { videoMediaSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = videoMediaSchema.partial();

export async function GET(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseFindUnique("media", id);
      if (!item || (item as { mediaType?: string }).mediaType !== "VIDEO") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    const item = await prisma.media.findFirst({ where: { id, mediaType: "VIDEO" } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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
  const row: Record<string, unknown> = { ...data, mediaType: "VIDEO" };
  delete row.uploadDate;
  if (data.description !== undefined) row.description = data.description?.trim() || null;
  if (data.uploadDate) row.createdAt = new Date(data.uploadDate).toISOString();

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseUpdate("media", id, row);
      return NextResponse.json(item);
    }

    const prismaData: Record<string, unknown> = { ...data };
    delete prismaData.uploadDate;
    if (data.uploadDate) prismaData.createdAt = new Date(data.uploadDate);
    if (data.description !== undefined) {
      prismaData.description = data.description?.trim() || null;
    }

    const item = await prisma.media.update({
      where: { id },
      data: prismaData,
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error("PATCH video:", e);
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
