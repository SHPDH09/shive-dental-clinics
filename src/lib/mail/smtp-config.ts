import { readWorkerEnvPlainOrB64 } from "@/lib/env-b64";
import { readWorkerEnv } from "@/lib/worker-env";
import { loadSettingsRow } from "@/lib/clinic-settings/service";
import type { ClinicSecrets, ExtendedClinicSettings } from "@/lib/clinic-settings/types";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
};

function normalizeAppPassword(raw: string): string {
  return raw.replace(/\s+/g, "").trim();
}

export function smtpFromEnv(): SmtpConfig | null {
  const user =
    readWorkerEnv("SMTP_USER")?.trim() ||
    readWorkerEnv("SMTP_USERNAME")?.trim() ||
    readWorkerEnv("GMAIL_USER")?.trim();
  const pass = normalizeAppPassword(
    readWorkerEnvPlainOrB64("SMTP_APP_PASSWORD") ||
      readWorkerEnvPlainOrB64("SMTP_PASSWORD") ||
      readWorkerEnvPlainOrB64("GMAIL_APP_PASSWORD") ||
      "",
  );
  if (!user || !pass) return null;

  const port = parseInt(readWorkerEnv("SMTP_PORT") || "587", 10);
  return {
    host: readWorkerEnv("SMTP_HOST")?.trim() || "smtp.gmail.com",
    port: Number.isFinite(port) ? port : 587,
    secure: readWorkerEnv("SMTP_SECURE") === "true" || port === 465,
    user,
    pass,
    fromName: readWorkerEnv("SMTP_FROM_NAME")?.trim() || "Shiv Dental Clinic",
    fromEmail: readWorkerEnv("SMTP_FROM_EMAIL")?.trim() || user,
  };
}

export async function resolveSmtpConfig(): Promise<SmtpConfig | null> {
  const fromEnv = smtpFromEnv();
  if (fromEnv) return fromEnv;

  try {
    const row = await loadSettingsRow();
    const secrets = (row.secrets ?? {}) as ClinicSecrets;
    const extended = row.extendedSettings as ExtendedClinicSettings | null | undefined;
    const email = extended?.email;
    const pass = secrets.smtpPassword?.trim();
    const user = email?.smtpUsername?.trim() || email?.senderEmail?.trim();
    if (!user || !pass) return null;
    const port = email?.smtpPort ?? 587;
    return {
      host: email?.smtpHost?.trim() || "smtp.gmail.com",
      port,
      secure: port === 465,
      user,
      pass: normalizeAppPassword(pass),
      fromName: email?.senderName?.trim() || "Shiv Dental Clinic",
      fromEmail: email?.senderEmail?.trim() || user,
    };
  } catch {
    return null;
  }
}

export function imapFromSmtp(smtp: SmtpConfig) {
  return {
    host: readWorkerEnv("IMAP_HOST")?.trim() || "imap.gmail.com",
    port: parseInt(readWorkerEnv("IMAP_PORT") || "993", 10),
    secure: true,
    user: smtp.user,
    pass: smtp.pass,
  };
}
