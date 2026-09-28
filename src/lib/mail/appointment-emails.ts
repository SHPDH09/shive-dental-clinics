import { sendMail } from "@/lib/mail/send-mail";
import { readWorkerEnv } from "@/lib/worker-env";

type AppointmentMailContext = {
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

export async function sendAppointmentBookedEmail(ctx: AppointmentMailContext) {
  const to = ctx.email?.trim();
  if (!to) return { ok: false as const, skipped: true };

  const subject = `Appointment received — ${ctx.appointmentCode} | Shiv Dental Clinic`;
  const text = `Dear ${ctx.patientName},

Thank you for booking with Shiv Dental Clinic.

Reference: ${ctx.appointmentCode}
Treatment: ${ctx.treatmentName}
Date: ${ctx.appointmentDate}
Time: ${ctx.appointmentTime}
Phone: ${ctx.phone}

Your request is pending confirmation. Our team will contact you shortly.

For urgent help call ${clinicPhone()}.

— Shiv Dental Clinic`;

  return sendMail({ to, subject, text });
}

export async function sendAppointmentStatusEmail(
  ctx: AppointmentMailContext,
  newStatus: string,
) {
  const to = ctx.email?.trim();
  if (!to) return { ok: false as const, skipped: true };

  const statusLabel =
    newStatus === "CONFIRMED"
      ? "confirmed"
      : newStatus === "COMPLETED"
        ? "marked as completed"
        : newStatus === "CANCELLED"
          ? "cancelled"
          : newStatus === "NO_SHOW"
            ? "marked as no-show"
            : `updated to ${newStatus}`;

  const subject = `Appointment ${statusLabel} — ${ctx.appointmentCode}`;
  const text = `Dear ${ctx.patientName},

Your appointment (${ctx.appointmentCode}) has been ${statusLabel}.

Treatment: ${ctx.treatmentName}
Date: ${ctx.appointmentDate}
Time: ${ctx.appointmentTime}

Questions? Reply to this email or call ${clinicPhone()}.

— Shiv Dental Clinic`;

  return sendMail({ to, subject, text });
}

export async function notifyAdminNewAppointment(ctx: AppointmentMailContext) {
  const adminEmail =
    readWorkerEnv("ADMIN_EMAIL")?.trim() || readWorkerEnv("ADMIN_LOGIN_ID")?.trim() || readWorkerEnv("SMTP_USER")?.trim();
  if (!adminEmail) return { ok: false as const, skipped: true };

  const subject = `New appointment: ${ctx.patientName} — ${ctx.appointmentCode}`;
  const text = `New booking on the website:

Name: ${ctx.patientName}
Phone: ${ctx.phone}
Email: ${ctx.email || "—"}
Treatment: ${ctx.treatmentName}
Date: ${ctx.appointmentDate} ${ctx.appointmentTime}
Code: ${ctx.appointmentCode}`;

  return sendMail({ to: adminEmail, subject, text });
}
