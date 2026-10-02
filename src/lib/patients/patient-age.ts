import { differenceInYears } from "date-fns";

export function patientAgeFromDob(dob: Date | string | null | undefined): number | null {
  if (!dob) return null;
  try {
    const d = typeof dob === "string" ? new Date(dob) : dob;
    if (Number.isNaN(d.getTime())) return null;
    return differenceInYears(new Date(), d);
  } catch {
    return null;
  }
}
