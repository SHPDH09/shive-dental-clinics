import { sendMail } from "@/lib/mail/send-mail";
import { whatsappLink } from "@/lib/utils";
import { logCommunication } from "@/lib/communications/log";
import { logPatientActivity } from "@/lib/patients/patient-activity";
import { logLeadActivity } from "@/lib/leads/lead-activity";
import type { CommunicationChannel } from "@/generated/prisma/client";

export type SendCommunicationInput = {
  channels: CommunicationChannel[];
  recipientName: string;
  phone?: string | null;
  email?: string | null;
  patientId?: string | null;
  leadId?: string | null;
  enquiryId?: string | null;
  subject?: string;
  message: string;
  templateSlug?: string | null;
  sentByAdminId?: string | null;
  sentByStaffName?: string | null;
  messageType?: string;
  branchId?: string | null;
  campaignId?: string | null;
  marketing?: boolean;
  commPrefs?: { commWhatsApp?: boolean; commPhone?: boolean; commEmail?: boolean };
};

export type SendCommunicationResult = {
  channel: CommunicationChannel;
  ok: boolean;
  status: "SENT" | "FAILED" | "PENDING";
  error?: string;
  whatsAppUrl?: string;
  logId?: string;
};

function blockedByPrefs(
  channel: CommunicationChannel,
  marketing: boolean,
  prefs?: SendCommunicationInput["commPrefs"],
): string | null {
  if (!marketing) return null;
  if (!prefs) return null;
  if (channel === "WHATSAPP" && prefs.commWhatsApp === false) return "Patient opted out of WhatsApp marketing";
  if (channel === "SMS" && prefs.commPhone === false) return "Patient opted out of SMS";
  if (channel === "EMAIL" && prefs.commEmail === false) return "Patient opted out of email marketing";
  return null;
}

export async function sendCommunication(
  input: SendCommunicationInput,
): Promise<SendCommunicationResult[]> {
  const results: SendCommunicationResult[] = [];

  for (const channel of input.channels) {
    const prefBlock = blockedByPrefs(channel, Boolean(input.marketing), input.commPrefs);
    if (prefBlock) {
      const logId = await logCommunication({
        channel,
        status: "FAILED",
        recipientName: input.recipientName,
        recipientPhone: input.phone,
        recipientEmail: input.email,
        patientId: input.patientId,
        leadId: input.leadId,
        enquiryId: input.enquiryId,
        subject: input.subject,
        body: input.message,
        templateSlug: input.templateSlug,
        failureReason: prefBlock,
        sentByAdminId: input.sentByAdminId,
        sentByStaffName: input.sentByStaffName,
        messageType: input.messageType,
        branchId: input.branchId,
        campaignId: input.campaignId,
      });
      results.push({ channel, ok: false, status: "FAILED", error: prefBlock, logId });
      continue;
    }

    if (channel === "EMAIL") {
      const to = input.email?.trim();
      if (!to) {
        const logId = await logCommunication({
          channel,
          status: "FAILED",
          recipientName: input.recipientName,
          patientId: input.patientId,
          leadId: input.leadId,
          body: input.message,
          subject: input.subject ?? "Message from Shiv Dental Clinic",
          failureReason: "No email address",
          sentByAdminId: input.sentByAdminId,
        sentByStaffName: input.sentByStaffName,
        messageType: input.messageType,
        branchId: input.branchId,
        campaignId: input.campaignId,
        });
        results.push({ channel, ok: false, status: "FAILED", error: "No email address", logId });
        continue;
      }
      const mail = await sendMail({
        to,
        subject: input.subject ?? "Message from Shiv Dental Clinic",
        text: input.message,
      });
      const logId = await logCommunication({
        channel,
        status: mail.ok ? "SENT" : "FAILED",
        recipientName: input.recipientName,
        recipientEmail: to,
        patientId: input.patientId,
        leadId: input.leadId,
        enquiryId: input.enquiryId,
        subject: input.subject ?? "Message from Shiv Dental Clinic",
        body: input.message,
        templateSlug: input.templateSlug,
        failureReason: mail.ok ? undefined : mail.error,
        externalId: mail.ok ? mail.messageId : undefined,
        sentByAdminId: input.sentByAdminId,
        sentByStaffName: input.sentByStaffName,
        messageType: input.messageType,
        branchId: input.branchId,
        campaignId: input.campaignId,
      });
      results.push({
        channel,
        ok: mail.ok,
        status: mail.ok ? "SENT" : "FAILED",
        error: mail.ok ? undefined : mail.error,
        logId,
      });
    } else if (channel === "WHATSAPP") {
      const phone = input.phone?.trim();
      if (!phone) {
        const logId = await logCommunication({
          channel,
          status: "FAILED",
          body: input.message,
          recipientName: input.recipientName,
          failureReason: "No phone number",
          sentByAdminId: input.sentByAdminId,
        sentByStaffName: input.sentByStaffName,
        messageType: input.messageType,
        branchId: input.branchId,
        campaignId: input.campaignId,
        });
        results.push({ channel, ok: false, status: "FAILED", error: "No phone number", logId });
        continue;
      }
      const url = whatsappLink(phone, input.message);
      const logId = await logCommunication({
        channel,
        status: "SENT",
        recipientName: input.recipientName,
        recipientPhone: phone,
        patientId: input.patientId,
        leadId: input.leadId,
        body: input.message,
        templateSlug: input.templateSlug,
        sentByAdminId: input.sentByAdminId,
        sentByStaffName: input.sentByStaffName,
        messageType: input.messageType,
        branchId: input.branchId,
        campaignId: input.campaignId,
        metadata: { whatsAppUrl: url, delivery: "staff_handoff" },
      });
      results.push({ channel, ok: true, status: "SENT", whatsAppUrl: url, logId });
    } else if (channel === "SMS") {
      const logId = await logCommunication({
        channel,
        status: "FAILED",
        recipientName: input.recipientName,
        recipientPhone: input.phone,
        patientId: input.patientId,
        leadId: input.leadId,
        body: input.message,
        failureReason: "SMS provider not configured on server",
        sentByAdminId: input.sentByAdminId,
        sentByStaffName: input.sentByStaffName,
        messageType: input.messageType,
        branchId: input.branchId,
        campaignId: input.campaignId,
      });
      results.push({
        channel,
        ok: false,
        status: "FAILED",
        error: "SMS provider not configured",
        logId,
      });
    } else if (channel === "IN_APP") {
      const logId = await logCommunication({
        channel,
        status: "SENT",
        recipientName: input.recipientName,
        patientId: input.patientId,
        leadId: input.leadId,
        body: input.message,
        subject: input.subject,
        sentByAdminId: input.sentByAdminId,
        sentByStaffName: input.sentByStaffName,
        messageType: input.messageType,
        branchId: input.branchId,
        campaignId: input.campaignId,
      });
      results.push({ channel, ok: true, status: "SENT", logId });
    }

    const sentOk = results[results.length - 1]?.ok;
    if (sentOk) {
      const title = `${channel} sent to ${input.recipientName}`;
      if (input.patientId) {
        await logPatientActivity({
          patientId: input.patientId,
          kind: "communication",
          title,
          detail: input.message.slice(0, 200),
          createdBy: input.sentByAdminId ?? undefined,
        });
      }
      if (input.leadId) {
        await logLeadActivity({
          leadId: input.leadId,
          kind: "communication",
          title,
          detail: input.message.slice(0, 200),
          createdBy: input.sentByAdminId ?? undefined,
        });
      }
    }
  }

  return results;
}
