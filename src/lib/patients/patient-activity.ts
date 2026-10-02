import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export async function logPatientActivity(input: {
  patientId: string;
  kind: string;
  title: string;
  detail?: string;
  createdBy?: string;
}) {
  const row = {
    id: createId(),
    patientId: input.patientId,
    kind: input.kind,
    title: input.title,
    detail: input.detail ?? null,
    at: new Date().toISOString(),
    createdBy: input.createdBy ?? null,
  };

  try {
    if (useSupabaseCrud()) {
      const sb = await getAdminSupabaseClient();
      await sb.from("PatientActivity").insert(row);
      return;
    }
    await prisma.patientActivity.create({
      data: {
        patientId: input.patientId,
        kind: input.kind,
        title: input.title,
        detail: input.detail,
        createdBy: input.createdBy,
      },
    });
  } catch (e) {
    console.error("logPatientActivity:", e);
  }
}
