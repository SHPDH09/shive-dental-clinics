import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import type { CommunicationChannel, CommunicationDirection, CommunicationStatus } from "@/generated/prisma/client";

export type LogCommunicationInput = {
  channel: CommunicationChannel;
  direction?: CommunicationDirection;
  status: CommunicationStatus;
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  patientId?: string | null;
  leadId?: string | null;
  enquiryId?: string | null;
  subject?: string | null;
  body: string;
  templateSlug?: string | null;
  failureReason?: string | null;
  externalId?: string | null;
  sentByAdminId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logCommunication(input: LogCommunicationInput): Promise<string> {
  const id = createId();
  const now = new Date();

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { error } = await sb.from("CommunicationLog").insert({
      id,
      channel: input.channel,
      direction: input.direction ?? "OUTBOUND",
      status: input.status,
      recipientName: input.recipientName ?? null,
      recipientPhone: input.recipientPhone ?? null,
      recipientEmail: input.recipientEmail ?? null,
      patientId: input.patientId ?? null,
      leadId: input.leadId ?? null,
      enquiryId: input.enquiryId ?? null,
      subject: input.subject ?? null,
      body: input.body,
      templateSlug: input.templateSlug ?? null,
      failureReason: input.failureReason ?? null,
      externalId: input.externalId ?? null,
      sentByAdminId: input.sentByAdminId ?? null,
      metadata: input.metadata ?? {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    if (error) console.warn("logCommunication supabase:", error.message);
    return id;
  }

  try {
    await prisma.communicationLog.create({
      data: {
        id,
        channel: input.channel,
        direction: input.direction ?? "OUTBOUND",
        status: input.status,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        recipientEmail: input.recipientEmail,
        patientId: input.patientId,
        leadId: input.leadId,
        enquiryId: input.enquiryId,
        subject: input.subject,
        body: input.body,
        templateSlug: input.templateSlug,
        failureReason: input.failureReason,
        externalId: input.externalId,
        sentByAdminId: input.sentByAdminId,
        metadata: (input.metadata ?? {}) as object,
      },
    });
  } catch (e) {
    console.warn("logCommunication prisma:", e);
  }
  return id;
}
