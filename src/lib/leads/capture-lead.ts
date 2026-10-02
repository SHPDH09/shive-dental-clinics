import { createId } from "@paralleldrive/cuid2";
import { generateLeadCode } from "@/lib/leads/lead-code";
import { logLeadActivity } from "@/lib/leads/lead-activity";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getAdminWriteSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type CaptureLeadInput = {
  name: string;
  phone: string;
  email?: string | null;
  whatsAppNumber?: string | null;
  interestedService?: string | null;
  source?: string;
  sourceCustom?: string | null;
  notes?: string | null;
  captureChannel?: string;
};

/** Upsert lead by phone (last 10 digits) for automatic capture from forms. */
export async function captureLeadFromWebsite(input: CaptureLeadInput): Promise<{ id: string; created: boolean }> {
  const digits = input.phone.replace(/\D/g, "").slice(-10);
  if (digits.length < 10 && input.phone !== "Not provided") {
    return { id: "", created: false };
  }

  const leadCode = await generateLeadCode();
  const now = new Date().toISOString();

  if (useSupabaseCrud()) {
    const sb = await getAdminWriteSupabaseClient();
    const { data: existing } = await sb
      .from("Lead")
      .select("id, leadCode")
      .ilike("phone", `%${digits}%`)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await sb
        .from("Lead")
        .update({
          name: input.name.length >= 2 ? input.name : undefined,
          email: input.email ?? undefined,
          interestedService: input.interestedService ?? undefined,
          updatedAt: now,
        })
        .eq("id", existing.id);
      await logLeadActivity({
        leadId: String(existing.id),
        kind: "capture",
        title: `Updated from ${input.captureChannel ?? "website"}`,
        detail: input.notes ?? undefined,
      });
      return { id: String(existing.id), created: false };
    }

    const id = createId();
    await sb.from("Lead").insert({
      id,
      leadCode,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      whatsAppNumber: input.whatsAppNumber ?? null,
      source: input.source ?? "WEBSITE",
      sourceCustom: input.sourceCustom ?? null,
      interestedService: input.interestedService ?? null,
      status: "NEW",
      priority: "MEDIUM",
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
    await logLeadActivity({
      leadId: id,
      kind: "created",
      title: `Lead captured — ${input.captureChannel ?? "website"}`,
      detail: input.interestedService ?? undefined,
    });
    await createNotification({
      type: "NEW_LEAD",
      title: "New lead",
      message: `${input.name} — ${input.interestedService ?? "Enquiry"}`,
      link: "/admin/leads",
    });
    return { id, created: true };
  }

  const existing = await prisma.lead.findFirst({
    where: { phone: { contains: digits } },
    select: { id: true },
  });

  if (existing) {
    await prisma.lead.update({
      where: { id: existing.id },
      data: {
        name: input.name.length >= 2 ? input.name : undefined,
        email: input.email ?? undefined,
        interestedService: input.interestedService ?? undefined,
      },
    });
    await logLeadActivity({
      leadId: existing.id,
      kind: "capture",
      title: `Updated from ${input.captureChannel ?? "website"}`,
      detail: input.notes ?? undefined,
    });
    return { id: existing.id, created: false };
  }

  const created = await prisma.lead.create({
    data: {
      leadCode,
      name: input.name,
      phone: input.phone,
      email: input.email,
      whatsAppNumber: input.whatsAppNumber,
      source: (input.source as "WEBSITE") ?? "WEBSITE",
      sourceCustom: input.sourceCustom,
      interestedService: input.interestedService,
      notes: input.notes,
      status: "NEW",
      priority: "MEDIUM",
    },
  });

  await logLeadActivity({
    leadId: created.id,
    kind: "created",
    title: `Lead captured — ${input.captureChannel ?? "website"}`,
    detail: input.interestedService ?? undefined,
  });

  await createNotification({
    type: "NEW_LEAD",
    title: "New lead",
    message: `${input.name} — ${input.interestedService ?? "Enquiry"}`,
    link: "/admin/leads",
  });

  return { id: created.id, created: true };
}
