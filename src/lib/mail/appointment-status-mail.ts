import type { AppointmentMailContext } from "@/lib/mail/appointment-emails";
import { sendAppointmentStatusEmail } from "@/lib/mail/appointment-emails";

export async function emailPatientOnStatusChange(
  ctx: AppointmentMailContext,
  newStatus: string,
  previousStatus: string | undefined,
) {
  if (newStatus === previousStatus) {
    return { ok: true as const, skipped: true as const };
  }
  return sendAppointmentStatusEmail(ctx, newStatus);
}
