import { requireAdminSession } from "@/lib/api-auth";
import { crudById } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseDelete, supabaseUpdate } from "@/lib/supabase/crud";
import { testimonialSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = testimonialSchema.partial();

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("testimonial", req, id);
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
  if (data.patientImage !== undefined) {
    row.patientImage = data.patientImage?.trim() || null;
  }
  if (data.testimonialDate) {
    row.testimonialDate = new Date(data.testimonialDate).toISOString();
  }

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseUpdate("testimonial", id, row);
      return NextResponse.json(item);
    }

    const prismaData: Record<string, unknown> = { ...data };
    if (data.testimonialDate) prismaData.testimonialDate = new Date(data.testimonialDate);
    if (data.patientImage !== undefined) {
      prismaData.patientImage = data.patientImage?.trim() || null;
    }

    const item = await prisma.testimonial.update({
      where: { id },
      data: prismaData,
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error("PATCH testimonial:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  try {
    if (canUseSupabaseDataLayer()) {
      await supabaseDelete("testimonial", id);
      return NextResponse.json({ success: true });
    }

    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
