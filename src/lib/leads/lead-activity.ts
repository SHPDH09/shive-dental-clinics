import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export async function logLeadActivity(input: {
  leadId: string;
  kind: string;
  title: string;
  detail?: string;
  createdBy?: string;
}) {
  const row = {
    id: createId(),
    leadId: input.leadId,
    kind: input.kind,
    title: input.title,
    detail: input.detail ?? null,
    at: new Date().toISOString(),
    createdBy: input.createdBy ?? null,
  };

  try {
    if (useSupabaseCrud()) {
      const sb = await getAdminSupabaseClient();
      await sb.from("LeadActivity").insert(row);
      return;
    }
    await prisma.leadActivity.create({
      data: {
        leadId: input.leadId,
        kind: input.kind,
        title: input.title,
        detail: input.detail,
        createdBy: input.createdBy,
      },
    });
  } catch (e) {
    console.error("logLeadActivity:", e);
  }
}
