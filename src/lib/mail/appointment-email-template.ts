import type { AppointmentMailContext } from "@/lib/mail/appointment-emails";

export function formatAppointmentDateLabel(isoOrYmd: string): string {
  const trimmed = isoOrYmd.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }
  return trimmed;
}

export function formatAppointmentTimeLabel(time: string): string {
  const t = time.trim();
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t;
  const h = Number(m[1]);
  const min = m[2];
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${min} ${suffix}`;
}

export function buildAppointmentBookedText(ctx: AppointmentMailContext, clinicPhone: string): string {
  const dateLabel = formatAppointmentDateLabel(ctx.appointmentDate);
  const timeLabel = formatAppointmentTimeLabel(ctx.appointmentTime);

  return `Dear ${ctx.patientName},

Thank you for booking with Shiv Dental Clinic.

Your appointment details
------------------------
Reference number: ${ctx.appointmentCode}
Name: ${ctx.patientName}
Phone: ${ctx.phone}
Email: ${ctx.email?.trim() || "—"}
Treatment: ${ctx.treatmentName}
Date: ${dateLabel}
Time: ${timeLabel}

Status: Pending confirmation — our team will contact you shortly.

For urgent help call ${clinicPhone}.

— Shiv Dental Clinic
shivedentalclinic.com`;
}

export function buildAppointmentBookedHtml(ctx: AppointmentMailContext, clinicPhone: string): string {
  const dateLabel = formatAppointmentDateLabel(ctx.appointmentDate);
  const timeLabel = formatAppointmentTimeLabel(ctx.appointmentTime);
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html>
<body style="font-family:Segoe UI,Roboto,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#0284c7;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0">
    <h1 style="margin:0;font-size:20px">Shiv Dental Clinic</h1>
    <p style="margin:8px 0 0;opacity:0.95;font-size:14px">Appointment request received</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:20px;border-radius:0 0 12px 12px">
    <p>Dear ${esc(ctx.patientName)},</p>
    <p>Thank you for booking with us. Please save your <strong>reference number</strong> for future communication.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <tr><td style="padding:8px 0;color:#64748b">Reference</td><td style="padding:8px 0;font-weight:700;font-size:16px;color:#0284c7">${esc(ctx.appointmentCode)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Name</td><td style="padding:8px 0">${esc(ctx.patientName)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Phone</td><td style="padding:8px 0">${esc(ctx.phone)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0">${esc(ctx.email?.trim() || "—")}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Treatment</td><td style="padding:8px 0">${esc(ctx.treatmentName)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Date</td><td style="padding:8px 0">${esc(dateLabel)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Time</td><td style="padding:8px 0">${esc(timeLabel)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Status</td><td style="padding:8px 0">Pending confirmation</td></tr>
    </table>
    <p style="font-size:14px;color:#475569">Our team will call or email you shortly to confirm your slot.</p>
    <p style="font-size:14px;color:#475569">Urgent help: <a href="tel:${esc(clinicPhone.replace(/\s/g, ""))}">${esc(clinicPhone)}</a></p>
  </div>
</body>
</html>`;
}

export function buildAppointmentConfirmedText(ctx: AppointmentMailContext, clinicPhone: string): string {
  const dateLabel = formatAppointmentDateLabel(ctx.appointmentDate);
  const timeLabel = formatAppointmentTimeLabel(ctx.appointmentTime);

  return `Dear ${ctx.patientName},

Your appointment is CONFIRMED at Shiv Dental Clinic.

Reference number: ${ctx.appointmentCode}
Name: ${ctx.patientName}
Phone: ${ctx.phone}
Treatment: ${ctx.treatmentName}
Date: ${dateLabel}
Time: ${timeLabel}

Please arrive a few minutes early. Bring your reference number if asked.

Questions? Call ${clinicPhone}.

— Shiv Dental Clinic`;
}

export function buildAppointmentConfirmedHtml(ctx: AppointmentMailContext, clinicPhone: string): string {
  const dateLabel = formatAppointmentDateLabel(ctx.appointmentDate);
  const timeLabel = formatAppointmentTimeLabel(ctx.appointmentTime);
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html>
<body style="font-family:Segoe UI,Roboto,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#059669;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0">
    <h1 style="margin:0;font-size:20px">Shiv Dental Clinic</h1>
    <p style="margin:8px 0 0;opacity:0.95;font-size:14px">Appointment confirmed</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:20px;border-radius:0 0 12px 12px">
    <p>Dear ${esc(ctx.patientName)},</p>
    <p>Your visit is <strong>confirmed</strong>. Please save your reference number.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <tr><td style="padding:8px 0;color:#64748b">Reference</td><td style="padding:8px 0;font-weight:700;font-size:16px;color:#059669">${esc(ctx.appointmentCode)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Name</td><td style="padding:8px 0">${esc(ctx.patientName)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Phone</td><td style="padding:8px 0">${esc(ctx.phone)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Treatment</td><td style="padding:8px 0">${esc(ctx.treatmentName)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Date</td><td style="padding:8px 0">${esc(dateLabel)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Time</td><td style="padding:8px 0">${esc(timeLabel)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Status</td><td style="padding:8px 0;font-weight:600;color:#059669">Confirmed</td></tr>
    </table>
    <p style="font-size:14px;color:#475569">Please arrive a few minutes early.</p>
    <p style="font-size:14px;color:#475569">Call: <a href="tel:${esc(clinicPhone.replace(/\s/g, ""))}">${esc(clinicPhone)}</a></p>
  </div>
</body>
</html>`;
}

export function buildAdminNewAppointmentText(ctx: AppointmentMailContext): string {
  const dateLabel = formatAppointmentDateLabel(ctx.appointmentDate);
  const timeLabel = formatAppointmentTimeLabel(ctx.appointmentTime);

  return `New patient appointment on the website

Reference: ${ctx.appointmentCode}
Patient name: ${ctx.patientName}
Phone: ${ctx.phone}
Email: ${ctx.email?.trim() || "—"}
Treatment: ${ctx.treatmentName}
Requested date: ${dateLabel}
Requested time: ${timeLabel}

Open admin panel → Appointments to confirm or contact the patient.

— Shiv Dental Clinic system`;
}

export function buildAdminNewAppointmentHtml(ctx: AppointmentMailContext): string {
  const dateLabel = formatAppointmentDateLabel(ctx.appointmentDate);
  const timeLabel = formatAppointmentTimeLabel(ctx.appointmentTime);
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html>
<body style="font-family:Segoe UI,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;padding:16px">
  <div style="background:#0f172a;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0">
    <h1 style="margin:0;font-size:18px">New patient appointment</h1>
    <p style="margin:6px 0 0;font-size:13px;opacity:0.9">Action needed — confirm in admin</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:18px;border-radius:0 0 10px 10px;font-size:14px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#64748b">Reference</td><td style="padding:6px 0;font-weight:700">${esc(ctx.appointmentCode)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Patient</td><td style="padding:6px 0">${esc(ctx.patientName)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Phone</td><td style="padding:6px 0">${esc(ctx.phone)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0">${esc(ctx.email?.trim() || "—")}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Treatment</td><td style="padding:6px 0">${esc(ctx.treatmentName)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">When</td><td style="padding:6px 0">${esc(dateLabel)} · ${esc(timeLabel)}</td></tr>
    </table>
  </div>
</body>
</html>`;
}
