import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import type { CommunicationChannel, CommunicationDirection, CommunicationStatus } from "@/generated/prisma/client";
import { appendThreadMessage } from "@/lib/communications/threads";

export type LogCommunicationInput = {
  channel: CommunicationChannel;
  direction?: CommunicationDirection;
  status: CommunicationStatus;
  messageType?: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  patientId?: string | null;
  leadId?: string | null;
  enquiryId?: string | null;
  threadId?: string | null;
  branchId?: string | null;
  campaignId?: string | null;
  subject?: string | null;
  body: string;
  templateSlug?: string | null;
  failureReason?: string | null;
  externalId?: string | null;
  sentByAdminId?: string | null;
  sentByStaffName?: string | null;
  metadata?: Record<string, unknown>;
  skipThread?: boolean;
};

export async function logCommunication(input: LogCommunicationInput): Promise<string> {
  const id = createId();
  const now = new Date();

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    let threadId = input.threadId ?? null;
    if (!input.skipThread && input.status !== "FAILED") {
      threadId =
        (await appendThreadMessage({
          channel: input.channel,
          direction: input.direction ?? "OUTBOUND",
          contactName: input.recipientName ?? "Contact",
          body: input.body,
          phone: input.recipientPhone,
          email: input.recipientEmail,
          patientId: input.patientId,
          leadId: input.leadId,
          enquiryId: input.enquiryId,
          branchId: input.branchId,
          sentByAdminId: input.sentByAdminId,
          sentByStaffName: input.sentByStaffName,
          communicationLogId: id,
          senderLabel: input.direction === "INBOUND" ? input.recipientName ?? "Patient" : input.sentByStaffName ?? "Staff",
        })) ?? threadId;
    }
    const { error } = await sb.from("CommunicationLog").insert({
      id,
      channel: input.channel,
      direction: input.direction ?? "OUTBOUND",
      status: input.status,
      messageType: input.messageType ?? "GENERAL",
      recipientName: input.recipientName ?? null,
      recipientPhone: input.recipientPhone ?? null,
      recipientEmail: input.recipientEmail ?? null,
      patientId: input.patientId ?? null,
      leadId: input.leadId ?? null,
      enquiryId: input.enquiryId ?? null,
      threadId,
      branchId: input.branchId ?? null,
      campaignId: input.campaignId ?? null,
      subject: input.subject ?? null,
      body: input.body,
      templateSlug: input.templateSlug ?? null,
      failureReason: input.failureReason ?? null,
      externalId: input.externalId ?? null,
      sentByAdminId: input.sentByAdminId ?? null,
      sentByStaffName: input.sentByStaffName ?? null,
      metadata: input.metadata ?? {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    if (error) console.warn("logCommunication supabase:", error.message);
    return id;
  }

  try {
    let threadId = input.threadId ?? null;
    if (!input.skipThread && input.status !== "FAILED") {
      threadId =
        (await appendThreadMessage({
          channel: input.channel,
          direction: input.direction ?? "OUTBOUND",
          contactName: input.recipientName ?? "Contact",
          body: input.body,
          phone: input.recipientPhone,
          email: input.recipientEmail,
          patientId: input.patientId,
          leadId: input.leadId,
          enquiryId: input.enquiryId,
          branchId: input.branchId,
          sentByAdminId: input.sentByAdminId,
          sentByStaffName: input.sentByStaffName,
          communicationLogId: id,
        })) ?? threadId;
    }
    await prisma.communicationLog.create({
      data: {
        id,
        channel: input.channel,
        direction: input.direction ?? "OUTBOUND",
        status: input.status,
        messageType: (input.messageType ?? "GENERAL") as never,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        recipientEmail: input.recipientEmail,
        patientId: input.patientId,
        leadId: input.leadId,
        enquiryId: input.enquiryId,
        threadId,
        branchId: input.branchId,
        campaignId: input.campaignId,
        subject: input.subject,
        body: input.body,
        templateSlug: input.templateSlug,
        failureReason: input.failureReason,
        externalId: input.externalId,
        sentByAdminId: input.sentByAdminId,
        sentByStaffName: input.sentByStaffName,
        metadata: (input.metadata ?? {}) as object,
      },
    });
  } catch (e) {
    console.warn("logCommunication prisma:", e);
  }
  return id;
}
