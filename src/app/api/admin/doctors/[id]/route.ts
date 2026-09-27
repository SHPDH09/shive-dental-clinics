import { crudById } from "@/lib/crud-route";
import { doctorPayloadFromInput } from "@/lib/admin-doctors";
import { prisma } from "@/lib/prisma";
import { supabaseUpdate, useSupabaseCrud } from "@/lib/supabase/crud";
import { doctorSchema } from "@/lib/validations";
import { requireAdminSession } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { formatConsultationSummary } from "@/lib/doctor-schedule";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("doctor", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = doctorSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug.trim();
  if (data.qualification !== undefined) updateData.qualification = data.qualification;
  if (data.specialization !== undefined) updateData.specialization = data.specialization;
  if (data.experienceYears !== undefined) updateData.experienceYears = data.experienceYears;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.areasOfExpertise !== undefined) updateData.areasOfExpertise = data.areasOfExpertise;
  if (data.languagesSpoken !== undefined) {
    updateData.languagesSpoken = data.languagesSpoken?.trim() || null;
  }
  if (data.weeklySchedule !== undefined) {
    updateData.weeklySchedule = data.weeklySchedule;
    updateData.consultationHours =
      data.consultationHours || formatConsultationSummary(data.weeklySchedule);
  } else if (data.consultationHours !== undefined) {
    updateData.consultationHours = data.consultationHours;
  }
  if (data.registrationNumber !== undefined) {
    updateData.registrationNumber = data.registrationNumber?.trim() || null;
  }
  if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
  if (data.featured !== undefined) updateData.featured = data.featured;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  if (useSupabaseCrud()) {
    try {
      const item = await supabaseUpdate("doctor", id, updateData);
      return NextResponse.json(item);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Database error" }, { status: 503 });
    }
  }

  try {
    const item = await prisma.doctor.update({ where: { id }, data: updateData });
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("doctor", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}
