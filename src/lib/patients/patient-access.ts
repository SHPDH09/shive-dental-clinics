import { normalizeAdminRole } from "@/lib/rbac/permissions";

/** Clinical / dental records — not for reception-only workflows. */
export function canViewPatientClinical(role: string | null | undefined): boolean {
  const r = normalizeAdminRole(role);
  return r === "SUPER_ADMIN" || r === "MANAGER" || r === "STAFF";
}

export function canExportPatients(role: string | null | undefined): boolean {
  const r = normalizeAdminRole(role);
  return r === "SUPER_ADMIN" || r === "MANAGER" || r === "STAFF";
}

export function stripClinicalFields<T extends Record<string, unknown>>(
  row: T,
  clinical: boolean,
): T {
  if (clinical) return row;
  const copy = { ...row };
  for (const key of [
    "allergies",
    "dentalHistory",
    "diagnosis",
    "treatmentPlan",
    "followUpInstructions",
    "examinationNotes",
    "medicalNotes",
    "treatmentHistory",
  ]) {
    if (key in copy) delete copy[key];
  }
  return copy;
}
