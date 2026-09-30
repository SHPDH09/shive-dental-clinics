import { format } from "date-fns";

export type AppointmentDetail = {
  id: string;
  appointmentCode: string;
  patientName: string;
  phone: string;
  email?: string | null;
  treatmentName: string;
  appointmentDate: string | Date;
  appointmentTime: string;
  status: string;
  message?: string | null;
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  branch?: { name?: string; city?: string | null } | null;
  doctor?: { name?: string } | null;
  service?: { name?: string } | null;
  patient?: { patientCode?: string } | null;
};

function formatDate(d: string | Date | undefined): string {
  if (!d) return "—";
  return format(new Date(d), "dd MMM yyyy, h:mm a");
}

function formatApptDay(d: string | Date): string {
  return format(new Date(d), "dd MMM yyyy");
}

export function appointmentDetailLines(a: AppointmentDetail): { label: string; value: string }[] {
  return [
    { label: "Appointment code", value: a.appointmentCode },
    { label: "Status", value: a.status },
    { label: "Patient name", value: a.patientName },
    { label: "Phone", value: a.phone },
    { label: "Email", value: a.email?.trim() || "—" },
    { label: "Treatment", value: a.treatmentName },
    { label: "Service", value: a.service?.name ?? "—" },
    { label: "Doctor", value: a.doctor?.name ?? "—" },
    { label: "Branch", value: a.branch?.name ? `${a.branch.name}${a.branch.city ? ` (${a.branch.city})` : ""}` : "—" },
    { label: "Patient ID", value: a.patient?.patientCode ?? "—" },
    { label: "Date", value: formatApptDay(a.appointmentDate) },
    { label: "Time", value: a.appointmentTime },
    { label: "Patient message", value: a.message?.trim() || "—" },
    { label: "Admin notes", value: a.notes?.trim() || "—" },
    { label: "Booked on", value: formatDate(a.createdAt) },
    { label: "Last updated", value: formatDate(a.updatedAt) },
  ];
}

export function appointmentPlainText(a: AppointmentDetail): string {
  const lines = appointmentDetailLines(a);
  const header = "Shiv Dental Clinic — Appointment Details";
  const body = lines.map((l) => `${l.label}: ${l.value}`).join("\n");
  return `${header}\n${"=".repeat(header.length)}\n\n${body}\n`;
}

export function appointmentPrintHtml(a: AppointmentDetail): string {
  const rows = appointmentDetailLines(a)
    .map(
      (l) =>
        `<tr><th style="text-align:left;padding:8px 12px;background:#f8fafc;width:180px;">${escapeHtml(l.label)}</th><td style="padding:8px 12px;">${escapeHtml(l.value)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(a.appointmentCode)}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a}h1{font-size:20px;margin:0 0 16px}table{border-collapse:collapse;width:100%;max-width:640px;border:1px solid #e2e8f0}@media print{body{padding:0}}</style></head>
<body><h1>Appointment — ${escapeHtml(a.appointmentCode)}</h1><p style="color:#64748b;margin:0 0 16px">Shiv Dental Clinic</p>
<table>${rows}</table></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function downloadAppointmentJson(a: AppointmentDetail, filename: string): void {
  const blob = new Blob([JSON.stringify(a, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename);
}

export function downloadAppointmentText(a: AppointmentDetail, filename: string): void {
  const blob = new Blob([appointmentPlainText(a)], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function shareAppointment(a: AppointmentDetail): Promise<"shared" | "copied" | "failed"> {
  const text = appointmentPlainText(a);
  const title = `Appointment ${a.appointmentCode}`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch {
      /* fall through */
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

export function printAppointment(a: AppointmentDetail): void {
  const html = appointmentPrintHtml(a);
  const win = window.open("", "_blank", "noopener,noreferrer,width=720,height=640");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
  };
  setTimeout(() => win.print(), 400);
}
