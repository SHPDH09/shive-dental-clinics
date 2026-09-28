import nodemailer from "nodemailer";
import { createId } from "@paralleldrive/cuid2";
import { resolveSmtpConfig, type SmtpConfig } from "@/lib/mail/smtp-config";
import { saveSentMail } from "@/lib/mail/mail-store";

export type SendMailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  cc?: string[];
  replyTo?: string;
};

export async function getMailTransport(cfg: SmtpConfig) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

export async function sendMail(input: SendMailInput): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const cfg = await resolveSmtpConfig();
  if (!cfg) {
    return { ok: false, error: "SMTP not configured. Set SMTP_USER and SMTP_APP_PASSWORD on the server." };
  }

  const toList = Array.isArray(input.to) ? input.to : [input.to];
  const transport = await getMailTransport(cfg);

  try {
    const info = await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to: toList.join(", "),
      cc: input.cc?.join(", "),
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, "<br/>"),
    });

    await saveSentMail({
      id: createId(),
      toAddresses: toList,
      ccAddresses: input.cc ?? [],
      fromAddress: cfg.fromEmail,
      subject: input.subject,
      bodyText: input.text,
      bodyHtml: input.html,
      sentAt: new Date(),
    });

    return { ok: true, messageId: info.messageId ?? createId() };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    console.error("sendMail:", msg);
    return { ok: false, error: msg };
  }
}
