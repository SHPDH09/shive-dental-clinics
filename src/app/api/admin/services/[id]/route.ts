import { crudById } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { supabaseUpdate, useSupabaseCrud } from "@/lib/supabase/crud";
import { serviceSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("service", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = serviceSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.shortDesc !== undefined) updateData.shortDesc = data.shortDesc;
  if (data.whatIsTreatment !== undefined) {
    updateData.whatIsTreatment = data.whatIsTreatment?.trim() || null;
  }
  if (data.image !== undefined) updateData.image = data.image;
  if (data.icon !== undefined) updateData.icon = data.icon?.trim() || null;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.treatmentDuration !== undefined) {
    updateData.treatmentDuration = data.treatmentDuration?.trim() || null;
  }
  if (data.price !== undefined) updateData.price = data.price?.trim() ? data.price.trim() : null;
  if (data.hidePrice !== undefined) updateData.hidePrice = data.hidePrice;
  if (data.benefits !== undefined) updateData.benefits = data.benefits;
  if (data.treatmentSteps !== undefined) updateData.treatmentSteps = data.treatmentSteps;
  if (data.faqs !== undefined) updateData.faqs = data.faqs;
  if (data.featured !== undefined) updateData.featured = data.featured;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  if (useSupabaseCrud()) {
    try {
      const item = await supabaseUpdate("service", id, updateData);
      return NextResponse.json(item);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Database error" }, { status: 503 });
    }
  }

  try {
    const prismaData: Prisma.ServiceUpdateInput = { ...updateData };
    if (data.price !== undefined) {
      prismaData.price = data.price?.trim() ? new Prisma.Decimal(data.price.trim()) : null;
    }
    const item = await prisma.service.update({ where: { id }, data: prismaData });
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("service", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}
