import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { logPatientActivity } from "@/lib/patients/patient-activity";

type AppointmentSyncInput = {
  patientId: string;
  treatmentName: string;
  appointmentDate: string | Date;
  doctorName?: string | null;
  doctorId?: string | null;
  status: string;
  appointmentCode?: string | null;
  createdBy?: string;
};

export async function onAppointmentLinkedToPatient(input: AppointmentSyncInput) {
  const title =
    input.status === "COMPLETED"
      ? `Visit completed — ${input.treatmentName}`
      : input.status === "CONFIRMED"
        ? `Appointment confirmed — ${input.treatmentName}`
        : `Appointment ${input.status.toLowerCase()} — ${input.treatmentName}`;

  await logPatientActivity({
    patientId: input.patientId,
    kind: input.status === "CONFIRMED" ? "communication" : "appointment",
    title,
    detail: input.appointmentCode ? `Ref: ${input.appointmentCode}` : undefined,
    createdBy: input.createdBy,
  });
}

export async function upsertTreatmentFromCompletedAppointment(input: AppointmentSyncInput) {
  if (input.status !== "COMPLETED") return;

  const treatmentDate =
    typeof input.appointmentDate === "string"
      ? new Date(input.appointmentDate)
      : input.appointmentDate;

  const treatmentName = input.treatmentName.trim();
  if (treatmentName.length < 2) return;

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data: existing } = await sb
      .from("PatientTreatment")
      .select("id")
      .eq("patientId", input.patientId)
      .eq("treatmentName", treatmentName)
      .gte("treatmentDate", new Date(treatmentDate.getTime() - 86400000).toISOString())
      .lte("treatmentDate", new Date(treatmentDate.getTime() + 86400000).toISOString())
      .maybeSingle();

    if (existing?.id) return;

    await sb.from("PatientTreatment").insert({
      id: createId(),
      patientId: input.patientId,
      treatmentName,
      doctorId: input.doctorId ?? null,
      doctorName: input.doctorName ?? null,
      treatmentDate: treatmentDate.toISOString(),
      status: "COMPLETED",
      notes: input.appointmentCode ? `From appointment ${input.appointmentCode}` : null,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const dup = await prisma.patientTreatment.findFirst({
    where: {
      patientId: input.patientId,
      treatmentName,
      treatmentDate: {
        gte: new Date(treatmentDate.getTime() - 86400000),
        lte: new Date(treatmentDate.getTime() + 86400000),
      },
    },
    select: { id: true },
  });
  if (dup) return;

  await prisma.patientTreatment.create({
    data: {
      patientId: input.patientId,
      treatmentName,
      doctorId: input.doctorId ?? undefined,
      doctorName: input.doctorName ?? undefined,
      treatmentDate,
      status: "COMPLETED",
      notes: input.appointmentCode ? `From appointment ${input.appointmentCode}` : undefined,
    },
  });
}

export async function syncAppointmentToPatientProfile(
  appt: AppointmentSyncInput & { patientId: string | null | undefined },
) {
  if (!appt.patientId) return;
  await onAppointmentLinkedToPatient({ ...appt, patientId: appt.patientId });
  if (appt.status === "COMPLETED") {
    await upsertTreatmentFromCompletedAppointment({ ...appt, patientId: appt.patientId });
  }
}
