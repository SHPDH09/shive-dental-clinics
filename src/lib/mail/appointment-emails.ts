import {
  buildAdminNewAppointmentHtml,
  buildAdminNewAppointmentText,
  buildAppointmentBookedHtml,
  buildAppointmentBookedText,
  buildAppointmentConfirmedHtml,
  buildAppointmentConfirmedText,
  formatAppointmentDateLabel,
  formatAppointmentTimeLabel,
} from "@/lib/mail/appointment-email-template";
import { sendMail } from "@/lib/mail/send-mail";
import { readWorkerEnv } from "@/lib/worker-env";

export type AppointmentMailContext = {
  patientName: string;
  email?: string | null;
  phone: string;
  treatmentName: string;
  appointmentCode: string;
  appointmentDate: string;
  appointmentTime: string;
  status?: string;
};

function clinicPhone(): string {
  return readWorkerEnv("CLINIC_PHONE") || "+91 99734 79904";
}

function mailReplyTo(): string | undefined {
  return (
    readWorkerEnv("SMTP_FROM_EMAIL")?.trim() ||
    readWorkerEnv("ADMIN_EMAIL")?.trim() ||
    readWorkerEnv("SMTP_USER")?.trim()
  );
}

export function resolveAdminNotifyEmail(): string | undefined {
  return (
    readWorkerEnv("ADMIN_NOTIFY_EMAIL")?.trim() ||
    readWorkerEnv("ADMIN_EMAIL")?.trim() ||
    readWorkerEnv("ADMIN_LOGIN_ID")?.trim() ||
    readWorkerEnv("SMTP_USER")?.trim()
  );
}

export async function sendAppointmentBookedEmail(ctx: AppointmentMailContext) {
  const to = ctx.email?.trim();
  if (!to) return { ok: false as const, skipped: true, error: "Patient email missing" };

  const phone = clinicPhone();
  const subject = `Appointment booked — Ref ${ctx.appointmentCode} | Shiv Dental Clinic`;
  const text = buildAppointmentBookedText(ctx, phone);
  const html = buildAppointmentBookedHtml(ctx, phone);

  return sendMail({ to, subject, text, html, replyTo: mailReplyTo() });
}

export async function sendAppointmentStatusEmail(
  ctx: AppointmentMailContext,
  newStatus: string,
) {
  const to = ctx.email?.trim();
  if (!to) return { ok: false as const, skipped: true, error: "Patient has no email on file" };

  if (newStatus === "CONFIRMED") {
    const phone = clinicPhone();
    const subject = `Appointment CONFIRMED — Ref ${ctx.appointmentCode} | Shiv Dental Clinic`;
    const text = buildAppointmentConfirmedText(ctx, phone);
    const html = buildAppointmentConfirmedHtml(ctx, phone);
    return sendMail({ to, subject, text, html, replyTo: mailReplyTo() });
  }

  const statusLabel =
    newStatus === "COMPLETED"
      ? "completed"
      : newStatus === "CANCELLED"
        ? "cancelled"
        : newStatus === "NO_SHOW"
          ? "marked as no-show"
          : `updated to ${newStatus}`;

  const dateLabel = formatAppointmentDateLabel(ctx.appointmentDate);
  const timeLabel = formatAppointmentTimeLabel(ctx.appointmentTime);

  const subject = `Appointment ${statusLabel} — Ref ${ctx.appointmentCode}`;
  const text = `Dear ${ctx.patientName},

Your appointment (${ctx.appointmentCode}) has been ${statusLabel}.

Treatment: ${ctx.treatmentName}
Date: ${dateLabel}
Time: ${timeLabel}

Questions? Reply to this email or call ${clinicPhone()}.

— Shiv Dental Clinic`;

  return sendMail({ to, subject, text, replyTo: mailReplyTo() });
}

/** Email admin when a patient books online (reminder to confirm). */
export async function notifyAdminNewAppointment(ctx: AppointmentMailContext) {
  const adminEmail = resolveAdminNotifyEmail();
  if (!adminEmail) return { ok: false as const, skipped: true, error: "Admin email not configured" };

  const subject = `[Shiv Dental] New patient appointment — ${ctx.patientName} — Ref ${ctx.appointmentCode}`;
  const text = buildAdminNewAppointmentText(ctx);
  const html = buildAdminNewAppointmentHtml(ctx);

  return sendMail({ to: adminEmail, subject, text, html });
}
