import { crudById } from "@/lib/crud-route";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { supabaseUpdate, useSupabaseCrud } from "@/lib/supabase/crud";
import { formatConsultationSummary } from "@/lib/doctor-schedule";
import { branchSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("branch", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = branchSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug.trim();
  if (data.image !== undefined) updateData.image = data.image || null;
  if (data.address !== undefined) {
    updateData.address = data.address;
    updateData.location = data.address;
  }
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state?.trim() || null;
  if (data.pinCode !== undefined) updateData.pinCode = data.pinCode?.trim() || null;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp?.trim() || null;
  if (data.mapUrl !== undefined) updateData.mapUrl = data.mapUrl?.trim() || null;
  if (data.mapEmbedUrl !== undefined) updateData.mapEmbedUrl = data.mapEmbedUrl?.trim() || null;
  if (data.latitude !== undefined) updateData.latitude = data.latitude?.trim() || null;
  if (data.longitude !== undefined) updateData.longitude = data.longitude?.trim() || null;
  if (data.weeklySchedule !== undefined) {
    updateData.weeklySchedule = data.weeklySchedule;
    if (!data.openTime && !data.closeTime) {
      updateData.openTime = formatConsultationSummary(data.weeklySchedule);
    }
  }
  if (data.openTime !== undefined) updateData.openTime = data.openTime;
  if (data.closeTime !== undefined) updateData.closeTime = data.closeTime;
  if (data.offDays !== undefined) updateData.offDays = data.offDays?.trim() || null;
  if (data.doctorIds !== undefined) updateData.doctorIds = data.doctorIds;
  if (data.serviceIds !== undefined) updateData.serviceIds = data.serviceIds;
  if (data.featured !== undefined) updateData.featured = data.featured;
  if (data.published !== undefined) updateData.published = data.published;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  if (useSupabaseCrud()) {
    try {
      const item = await supabaseUpdate("branch", id, updateData);
      return NextResponse.json(item);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Database error" }, { status: 503 });
    }
  }

  try {
    const item = await prisma.branch.update({ where: { id }, data: updateData });
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("branch", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}
