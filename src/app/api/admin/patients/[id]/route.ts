import { requirePermission } from "@/lib/api-auth";
import { getPatientProfileForAdmin } from "@/lib/patients/build-patient-profile";
import { logPatientActivity } from "@/lib/patients/patient-activity";
import { canViewPatientClinical } from "@/lib/patients/patient-access";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer, getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { supabaseDelete, supabaseFindUnique, supabaseUpdate } from "@/lib/supabase/crud";
import { patientSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

function mapPatientUpdate(body: Record<string, unknown>, clinical: boolean) {
  const parsed = patientSchema.partial().safeParse(body);
  if (!parsed.success) return null;
  const data = parsed.data;
  const out: Record<string, unknown> = {};

  const simple = [
    "name",
    "phone",
    "email",
    "gender",
    "profilePhoto",
    "address",
    "city",
    "state",
    "pinCode",
    "emergencyContactName",
    "emergencyContactPhone",
    "preferredBranchId",
    "assignedDoctorId",
    "commWhatsApp",
    "commPhone",
    "commEmail",
    "status",
    "medicalNotes",
    "consent",
  ] as const;

  for (const field of simple) {
    if (data[field] !== undefined) out[field] = data[field] === "" ? null : data[field];
  }

  if (data.dateOfBirth !== undefined) {
    out.dateOfBirth =
      data.dateOfBirth === null || data.dateOfBirth === ""
        ? null
        : new Date(data.dateOfBirth).toISOString();
  }

  if (clinical) {
    for (const field of [
      "allergies",
      "dentalHistory",
      "diagnosis",
      "treatmentPlan",
      "followUpInstructions",
      "examinationNotes",
      "treatmentHistory",
    ] as const) {
      if (data[field] !== undefined) out[field] = data[field] === "" ? null : data[field];
    }
  }

  if (body.archive === true) {
    out.status = "ARCHIVED";
    out.archivedAt = new Date().toISOString();
  }

  return out;
}

export async function GET(req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("patients", "view");
  if (error) return error;

  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const full =
    searchParams.get("profile") === "full" || req.headers.get("x-patient-profile") === "1";

  try {
    if (full) {
      const profile = await getPatientProfileForAdmin(id, session!.user.role);
      if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(profile);
    }

    if (canUseSupabaseDataLayer()) {
      const item = await supabaseFindUnique("patient", id);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(item);
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
  const { session, error } = await requirePermission("patients", "edit");
  if (error) return error;

  const { id } = await context.params;
  const body = (await req.json()) as Record<string, unknown>;
  const clinical = canViewPatientClinical(session!.user.role);
  const data = mapPatientUpdate(body, clinical);
  if (!data || Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  if (body.archive === true) {
    data.archivedBy = session!.user.id;
  }

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseUpdate("patient", id, data);
      if (body.archive === true) {
        await logPatientActivity({
          patientId: id,
          kind: "archive",
          title: "Patient archived",
          createdBy: session!.user.id,
        });
      }
      return NextResponse.json(item);
    }

    const prismaData = { ...data };
    if (typeof prismaData.dateOfBirth === "string") {
      prismaData.dateOfBirth = new Date(prismaData.dateOfBirth);
    }
    if (typeof prismaData.archivedAt === "string") {
      prismaData.archivedAt = new Date(prismaData.archivedAt);
    }

    const item = await prisma.patient.update({
      where: { id },
      data: prismaData as Parameters<typeof prisma.patient.update>[0]["data"],
    });

    if (body.archive === true) {
      await logPatientActivity({
        patientId: id,
        kind: "archive",
        title: "Patient archived",
        createdBy: session!.user.id,
      });
    } else {
      await logPatientActivity({
        patientId: id,
        kind: "updated",
        title: "Patient profile updated",
        createdBy: session!.user.id,
      });
    }

    return NextResponse.json(item);
  } catch (e) {
    console.error("PATCH patient:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("patients", "delete");
  if (error) return error;

  const { id } = await context.params;

  try {
    if (canUseSupabaseDataLayer()) {
      await supabaseUpdate("patient", id, {
        status: "ARCHIVED",
        archivedAt: new Date().toISOString(),
        archivedBy: session!.user.id,
      });
      return NextResponse.json({ archived: true });
    }

    await prisma.patient.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        archivedBy: session!.user.id,
      },
    });
    await logPatientActivity({
      patientId: id,
      kind: "archive",
      title: "Patient archived (soft delete)",
      createdBy: session!.user.id,
    });
    return NextResponse.json({ archived: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
