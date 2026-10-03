export type TemplateVars = Record<string, string>;

/** Normalizes {{patient_name}} and {{ patient_name }} style placeholders. */
export function renderTemplate(text: string, vars: TemplateVars): string {
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    const safe = value ?? "";
    const patterns = [
      new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, "gi"),
      new RegExp(`\\{\\{\\s*${escapeRegExp(snakeToLegacy(key))}\\s*\\}\\}`, "gi"),
    ];
    for (const re of patterns) out = out.replace(re, safe);
  }
  return out;
}

function snakeToLegacy(key: string): string {
  return key.replace(/_/g, "_");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const STANDARD_TEMPLATE_VARIABLES = [
  "patient_name",
  "patient_id",
  "doctor_name",
  "service_name",
  "appointment_date",
  "appointment_time",
  "branch_name",
  "clinic_phone",
  "clinic_whatsapp",
  "date",
  "time",
] as const;

export function buildClinicTemplateVars(input: {
  patientName?: string | null;
  patientCode?: string | null;
  doctorName?: string | null;
  serviceName?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  branchName?: string | null;
  clinicPhone?: string | null;
  clinicWhatsApp?: string | null;
}): TemplateVars {
  return {
    patient_name: input.patientName ?? "",
    patient_id: input.patientCode ?? "",
    doctor_name: input.doctorName ?? "",
    service_name: input.serviceName ?? "",
    appointment_date: input.appointmentDate ?? "",
    appointment_time: input.appointmentTime ?? "",
    branch_name: input.branchName ?? "",
    clinic_phone: input.clinicPhone ?? "",
    clinic_whatsapp: input.clinicWhatsApp ?? "",
    date: input.appointmentDate ?? "",
    time: input.appointmentTime ?? "",
  };
}
