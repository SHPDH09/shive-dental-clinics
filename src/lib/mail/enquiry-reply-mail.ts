import { sendMail } from "@/lib/mail/send-mail";
import { readWorkerEnv } from "@/lib/worker-env";

export function isValidReplyEmail(raw: string | null | undefined): raw is string {
  const e = raw?.trim();
  if (!e) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function sendEnquiryReplyEmail(input: {
  to: string;
  patientName: string;
  subject: string;
  message: string;
}) {
  const name = input.patientName.trim() || "Patient";
  const subject = input.subject.trim() || "Reply from Shiv Dental Clinic";
  const body = input.message.trim();

  const text = `Dear ${name},

${body}

— Shiv Dental Clinic`;

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const html = `<!DOCTYPE html>
<html><body style="font-family:Segoe UI,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;padding:16px">
<p>Dear ${esc(name)},</p>
<p style="white-space:pre-wrap">${esc(body).replace(/\n/g, "<br/>")}</p>
<p style="color:#64748b;font-size:14px">— Shiv Dental Clinic</p>
</body></html>`;

  const replyTo =
    readWorkerEnv("SMTP_FROM_EMAIL")?.trim() ||
    readWorkerEnv("ADMIN_EMAIL")?.trim() ||
    readWorkerEnv("SMTP_USER")?.trim();

  return sendMail({ to: input.to.trim(), subject, text, html, replyTo });
}
