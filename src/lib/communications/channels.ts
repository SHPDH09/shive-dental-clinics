import { resolveSmtpConfig } from "@/lib/mail/smtp-config";
import { loadSettingsRow } from "@/lib/clinic-settings/service";

export type ChannelStatus = {
  channel: "WHATSAPP" | "SMS" | "EMAIL" | "IN_APP";
  connected: boolean;
  label: string;
  detail: string;
};

export async function getCommunicationChannelStatus(): Promise<ChannelStatus[]> {
  const smtp = await resolveSmtpConfig();
  const settings = await loadSettingsRow().catch(() => null);
  const ext = (settings?.extendedSettings ?? {}) as {
    whatsapp?: { businessNumber?: string };
    integrations?: { sms?: { connected?: boolean }; whatsapp?: { connected?: boolean } };
  };
  const secrets = (settings?.secrets ?? {}) as { smsApiKey?: string };

  const waNumber = ext.whatsapp?.businessNumber?.trim();
  const smsKey = secrets.smsApiKey?.trim();

  return [
    {
      channel: "WHATSAPP",
      connected: Boolean(waNumber) || Boolean(ext.integrations?.whatsapp?.connected),
      label: "WhatsApp",
      detail: waNumber
        ? `Business number configured (${waNumber}). Opens WhatsApp Web/App for staff sends.`
        : "Configure business number in Settings → WhatsApp. API webhook optional.",
    },
    {
      channel: "SMS",
      connected: Boolean(smsKey) || Boolean(ext.integrations?.sms?.connected),
      label: "SMS",
      detail: smsKey ? "SMS API key stored (server-side)." : "Add SMS provider API key in Settings (Super Admin).",
    },
    {
      channel: "EMAIL",
      connected: Boolean(smtp),
      label: "Email",
      detail: smtp ? `SMTP ready (${smtp.fromEmail})` : "Set SMTP_USER and SMTP_APP_PASSWORD on the worker.",
    },
    {
      channel: "IN_APP",
      connected: true,
      label: "In-App Notifications",
      detail: "Admin notification feed (bell) — always available.",
    },
  ];
}
