import { findDuplicatePatients } from "@/lib/patients/build-patient-dashboard";
import { generatePatientCode } from "@/lib/patients/patient-code";
import { logPatientActivity } from "@/lib/patients/patient-activity";
import { logLeadActivity } from "@/lib/leads/lead-activity";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { createId } from "@paralleldrive/cuid2";

export async function convertLeadToPatient(
  leadId: string,
  options: { forceLinkPatientId?: string; createdBy?: string },
): Promise<{ patientId: string; created: boolean; duplicate?: boolean }> {
  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data: lead } = await sb.from("Lead").select("*").eq("id", leadId).maybeSingle();
    if (!lead) throw new Error("Lead not found");

    let patientId = options.forceLinkPatientId ?? (lead.patientId as string | null);
    let created = false;

    if (!patientId) {
      const dups = await findDuplicatePatients(String(lead.phone), lead.email as string | null);
      if (dups.length > 0 && !options.forceLinkPatientId) {
        return { patientId: dups[0]!.id, created: false, duplicate: true };
      }
      patientId = createId();
      const code = await generatePatientCode();
      await sb.from("Patient").insert({
        id: patientId,
        patientCode: code,
        name: String(lead.name),
        phone: String(lead.phone),
        email: lead.email,
        preferredBranchId: lead.preferredBranchId,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      created = true;
    }

    await sb
      .from("Lead")
      .update({
        status: "CONVERTED",
        patientId,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", leadId);

    await logLeadActivity({
      leadId,
      kind: "conversion",
      title: "Converted to patient",
      detail: patientId,
      createdBy: options.createdBy,
    });

    return { patientId, created };
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  if (lead.patientId) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "CONVERTED" },
    });
    return { patientId: lead.patientId, created: false };
  }

  const dups = await findDuplicatePatients(lead.phone, lead.email);
  if (dups.length > 0 && !options.forceLinkPatientId) {
    return { patientId: dups[0]!.id, created: false, duplicate: true };
  }

  let patientId = options.forceLinkPatientId;
  let created = false;

  if (!patientId) {
    const code = await generatePatientCode();
    const patient = await prisma.patient.create({
      data: {
        patientCode: code,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        preferredBranchId: lead.preferredBranchId,
      },
    });
    patientId = patient.id;
    created = true;
    await logPatientActivity({
      patientId,
      kind: "lead_conversion",
      title: `Created from lead ${lead.leadCode}`,
      createdBy: options.createdBy,
    });
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "CONVERTED", patientId },
  });

  await logLeadActivity({
    leadId,
    kind: "conversion",
    title: "Converted to patient",
    detail: patientId,
    createdBy: options.createdBy,
  });

  return { patientId, created };
}
