import { requirePermission } from "@/lib/api-auth";
import { loadSettingsRow } from "@/lib/clinic-settings/service";
import { getCommunicationChannelStatus } from "@/lib/communications/channels";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;

  const settings = await loadSettingsRow().catch(() => null);
  const channels = await getCommunicationChannelStatus();

  const commMeta = (settings?.metadata as Record<string, unknown> | undefined)?.communications as
    | Record<string, unknown>
    | undefined;

  return NextResponse.json({
    whatsApp: {
      businessNumber: settings?.whatsapp ?? settings?.phone ?? "",
      connected: channels.find((c) => c.channel === "WHATSAPP")?.connected ?? false,
    },
    sms: {
      senderId: String(commMeta?.smsSenderId ?? ""),
      connected: channels.find((c) => c.channel === "SMS")?.connected ?? false,
    },
    email: {
      senderName: String(settings?.siteName ?? "Shiv Dental Clinic"),
      senderEmail: String(settings?.email ?? ""),
      replyTo: String(commMeta?.replyTo ?? settings?.email ?? ""),
      connected: channels.find((c) => c.channel === "EMAIL")?.connected ?? false,
    },
    general: {
      defaultChannel: String(commMeta?.defaultChannel ?? "WHATSAPP"),
      dailyLimit: Number(commMeta?.dailyLimit ?? 500),
      quietHoursStart: String(commMeta?.quietHoursStart ?? "21:00"),
      quietHoursEnd: String(commMeta?.quietHoursEnd ?? "08:00"),
      retryAttempts: Number(commMeta?.retryAttempts ?? 2),
    },
    privacy: {
      appointmentMessages: true,
      followUpMessages: true,
      whatsAppOptInDefault: true,
      smsOptInDefault: true,
      emailOptInDefault: false,
      marketingRequiresConsent: true,
    },
    settingsUrl: "/admin/settings",
  });
}
