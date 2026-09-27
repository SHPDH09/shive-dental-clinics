import { requireAdminSession } from "@/lib/api-auth";
import { crudById } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseDelete, supabaseUpdate } from "@/lib/supabase/crud";
import { beforeAfterSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = beforeAfterSchema.partial();

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("beforeAfter", req, id);
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
  const merged = { ...data };
  if (data.isPublic && data.status === "PUBLISHED" && data.consentConfirmed === false) {
    return NextResponse.json({ error: "Consent required for public published cases" }, { status: 400 });
  }

  const row: Record<string, unknown> = { ...merged };
  if (data.description !== undefined) row.description = data.description?.trim() || null;
  if (data.treatmentDuration !== undefined) {
    row.treatmentDuration = data.treatmentDuration?.trim() || null;
  }
  if (data.caseDate) row.caseDate = new Date(data.caseDate).toISOString();

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseUpdate("beforeAfter", id, row);
      return NextResponse.json(item);
    }

    const prismaData: Record<string, unknown> = { ...data };
    if (data.caseDate) prismaData.caseDate = new Date(data.caseDate);
    const item = await prisma.beforeAfter.update({ where: { id }, data: prismaData });
    return NextResponse.json(item);
  } catch (e) {
    console.error("PATCH before-after:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  try {
    if (canUseSupabaseDataLayer()) {
      await supabaseDelete("beforeAfter", id);
      return NextResponse.json({ success: true });
    }

    await prisma.beforeAfter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
