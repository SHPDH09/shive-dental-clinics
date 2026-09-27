import { createId } from "@paralleldrive/cuid2";
import { findPatientIdByPhone } from "@/lib/enquiry-helpers";
import { prisma } from "@/lib/prisma";
import { supabaseCreate, useSupabaseCrud } from "@/lib/supabase/crud";

export async function createAppointmentEnquiry(input: {
  patientName: string;
  phone: string;
  email?: string | null;
  treatmentName: string;
  appointmentCode: string;
  message?: string | null;
}) {
  const subject = `Appointment request — ${input.treatmentName}`;
  const body = [
    `Appointment reference: ${input.appointmentCode}`,
    `Treatment: ${input.treatmentName}`,
    input.message ? `Notes: ${input.message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const patientId = await findPatientIdByPhone(input.phone);
  const inbound = {
    id: createId(),
    direction: "in" as const,
    subject,
    body,
    sentAt: new Date().toISOString(),
  };

  const payload = {
    name: input.patientName,
    phone: input.phone,
    email: input.email || null,
    subject,
    message: body,
    source: "APPOINTMENT",
    status: "NEW",
    patientId,
    conversation: [inbound],
    auditLog: [],
  };

  if (useSupabaseCrud()) {
    await supabaseCreate("enquiry", payload);
    return;
  }

  await prisma.enquiry.create({
    data: {
      ...payload,
      source: "APPOINTMENT",
      status: "NEW",
    },
  });
}
