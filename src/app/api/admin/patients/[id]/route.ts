import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer, getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { supabaseDelete, supabaseFindUnique, supabaseUpdate } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

function mapPatientUpdate(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  const fields = [
    "name",
    "phone",
    "email",
    "gender",
    "address",
    "medicalNotes",
    "treatmentHistory",
  ] as const;

  for (const field of fields) {
    if (body[field] !== undefined) {
      data[field] = body[field] === "" ? null : body[field];
    }
  }

  if (body.dateOfBirth !== undefined) {
    data.dateOfBirth =
      body.dateOfBirth === null || body.dateOfBirth === ""
        ? null
        : new Date(String(body.dateOfBirth)).toISOString();
  }

  return data;
}

export async function GET(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseFindUnique("patient", id);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const sb = await getAdminSupabaseClient();
      const { data: appointments } = await sb
        .from("Appointment")
        .select("*")
        .eq("patientId", id)
        .order("appointmentDate", { ascending: false })
        .limit(20);
      return NextResponse.json({ ...item, appointments: appointments ?? [] });
    }

    const item = await prisma.patient.findUnique({
      where: { id },
      include: { appointments: { orderBy: { appointmentDate: "desc" }, take: 20 } },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (e) {
    console.error("GET patient:", e);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = (await req.json()) as Record<string, unknown>;
  const data = mapPatientUpdate(body);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseUpdate("patient", id, data);
      return NextResponse.json(item);
    }

    const prismaData = { ...data };
    if (prismaData.dateOfBirth && typeof prismaData.dateOfBirth === "string") {
      prismaData.dateOfBirth = new Date(prismaData.dateOfBirth);
    }
    const item = await prisma.patient.update({ where: { id }, data: prismaData });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  try {
    if (canUseSupabaseDataLayer()) {
      await supabaseDelete("patient", id);
      return NextResponse.json({ success: true });
    }

    await prisma.patient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
