import { requirePermission } from "@/lib/api-auth";
import { logPatientActivity } from "@/lib/patients/patient-activity";
import { canViewPatientClinical } from "@/lib/patients/patient-access";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { z } from "zod";
import { NextResponse } from "next/server";

const treatmentSchema = z.object({
  treatmentName: z.string().min(2),
  doctorId: z.string().optional(),
  doctorName: z.string().optional(),
  treatmentDate: z.string(),
  toothArea: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("patients", "view");
  if (error) return error;
  if (!canViewPatientClinical(session!.user.role)) {
    return NextResponse.json({ items: [] });
  }

  const { id } = await context.params;

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data } = await sb
      .from("PatientTreatment")
      .select("*")
      .eq("patientId", id)
      .order("treatmentDate", { ascending: false });
    return NextResponse.json({ items: data ?? [] });
  }

  const items = await prisma.patientTreatment.findMany({
    where: { patientId: id },
    orderBy: { treatmentDate: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("patients", "edit");
  if (error) return error;
  if (!canViewPatientClinical(session!.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: patientId } = await context.params;
  const parsed = treatmentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const row = {
    id: createId(),
    patientId,
    treatmentName: d.treatmentName,
    doctorId: d.doctorId ?? null,
    doctorName: d.doctorName ?? null,
    treatmentDate: new Date(d.treatmentDate).toISOString(),
    toothArea: d.toothArea ?? null,
    diagnosis: d.diagnosis ?? null,
    notes: d.notes ?? null,
    followUpDate: d.followUpDate ? new Date(d.followUpDate).toISOString() : null,
    status: d.status ?? "COMPLETED",
    updatedAt: new Date().toISOString(),
  };

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    await sb.from("PatientTreatment").insert(row);
  } else {
    await prisma.patientTreatment.create({
      data: {
        patientId,
        treatmentName: d.treatmentName,
        doctorId: d.doctorId,
        doctorName: d.doctorName,
        treatmentDate: new Date(d.treatmentDate),
        toothArea: d.toothArea,
        diagnosis: d.diagnosis,
        notes: d.notes,
        followUpDate: d.followUpDate ? new Date(d.followUpDate) : null,
        status: d.status ?? "COMPLETED",
      },
    });
  }

  await logPatientActivity({
    patientId,
    kind: "treatment",
    title: `Treatment recorded — ${d.treatmentName}`,
    createdBy: session!.user.id,
  });

  if (d.followUpDate) {
    await prisma.patient.update({
      where: { id: patientId },
      data: { status: "FOLLOW_UP_REQUIRED" },
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
