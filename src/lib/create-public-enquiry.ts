import { createId } from "@paralleldrive/cuid2";
import { captureLeadFromWebsite } from "@/lib/leads/capture-lead";
import { findPatientIdByPhone } from "@/lib/enquiry-helpers";
import { prisma } from "@/lib/prisma";
import { getAdminWriteSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type PublicEnquiryInput = {
  name: string;
  phone: string;
  email?: string | null;
  subject?: string | null;
  message: string;
};

/** Create contact enquiry; tolerates older Enquiry schema (missing premium JSON columns). */
export async function createPublicEnquiry(data: PublicEnquiryInput): Promise<{ id: string; name: string }> {
  const subject = data.subject?.trim() || "Website contact enquiry";
  const patientId = await findPatientIdByPhone(data.phone);
  const inbound = {
    id: createId(),
    direction: "in" as const,
    subject,
    body: data.message,
    sentAt: new Date().toISOString(),
  };

  const fullPayload = {
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    subject,
    message: data.message,
    source: "WEBSITE",
    status: "NEW",
    important: false,
    patientId,
    conversation: [inbound],
    auditLog: [],
  };

  const minimalPayload = {
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    message: data.message,
    status: "NEW",
  };

  if (useSupabaseCrud()) {
    const sb = await getAdminWriteSupabaseClient();
    const now = new Date().toISOString();
    const id = createId();

    let { data: row, error } = await sb
      .from("Enquiry")
      .insert({ id, ...fullPayload, createdAt: now, updatedAt: now })
      .select("id, name")
      .maybeSingle();

    if (error && /column|schema|PGRST204/i.test(error.message)) {
      ({ data: row, error } = await sb
        .from("Enquiry")
        .insert({ id, ...minimalPayload, createdAt: now, updatedAt: now })
        .select("id, name")
        .maybeSingle());
    }

    if (error) throw new Error(error.message);
    if (!row) throw new Error("Enquiry was not created");
    void captureLeadFromWebsite({
      name: data.name,
      phone: data.phone,
      email: data.email,
      interestedService: subject,
      source: "WEBSITE",
      captureChannel: "contact_form",
      notes: data.message,
    }).catch((e) => console.error("Lead capture from enquiry:", e));
    return row as { id: string; name: string };
  }

  try {
    const created = await prisma.enquiry.create({
      data: { ...fullPayload, source: "WEBSITE", status: "NEW" },
    });
    void captureLeadFromWebsite({
      name: data.name,
      phone: data.phone,
      email: data.email,
      interestedService: subject,
      source: "WEBSITE",
      captureChannel: "contact_form",
      notes: data.message,
    }).catch((e) => console.error("Lead capture from enquiry:", e));
    return created;
  } catch {
    const created = await prisma.enquiry.create({
      data: { ...minimalPayload, status: "NEW" },
    });
    void captureLeadFromWebsite({
      name: data.name,
      phone: data.phone,
      email: data.email,
      interestedService: subject,
      source: "WEBSITE",
      captureChannel: "contact_form",
      notes: data.message,
    }).catch((e) => console.error("Lead capture from enquiry:", e));
    return created;
  }
}
