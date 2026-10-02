import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { supabaseCreate } from "@/lib/supabase/crud";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { generatePatientCode } from "@/lib/patients/patient-code";
import { normalizeIndianMobile, normalizeVoiceEmail } from "@/lib/voice-booking/validate-contact";

export type AppointmentPatientInput = {
  patientName: string;
  phone: string;
  email?: string | null;
};

async function findPatientIdByPhonePrisma(phone: string): Promise<string | null> {
  const normalized = normalizeIndianMobile(phone);
  const digits = (normalized ?? phone).replace(/\D/g, "").slice(-10);
  if (digits.length < 10) return null;
  try {
    const patient = await prisma.patient.findFirst({
      where: { phone: { contains: digits } },
      select: { id: true },
    });
    return patient?.id ?? null;
  } catch {
    return null;
  }
}

async function findPatientIdByPhoneSupabase(phone: string): Promise<string | null> {
  const normalized = normalizeIndianMobile(phone);
  const digits = (normalized ?? phone).replace(/\D/g, "").slice(-10);
  if (digits.length < 10) return null;
  try {
    const sb = await getAdminSupabaseClient();
    const { data, error } = await sb
      .from("Patient")
      .select("id, phone")
      .or(`phone.ilike.%${digits}%,phone.eq.${normalized ?? digits}`);
    if (error || !data?.length) return null;
    const match =
      data.find((row) => String(row.phone ?? "").replace(/\D/g, "").slice(-10) === digits) ??
      data[0];
    return match?.id ? String(match.id) : null;
  } catch {
    return null;
  }
}

/**
 * When admin confirms an appointment, ensure a Patient row exists and return its id.
 */
export async function ensurePatientForConfirmedAppointment(
  input: AppointmentPatientInput,
  options: { useSupabase: boolean; existingPatientId?: string | null },
): Promise<{ patientId: string | null; created: boolean }> {
  if (options.existingPatientId) {
    return { patientId: options.existingPatientId, created: false };
  }

  const phone = normalizeIndianMobile(input.phone) ?? input.phone.trim();
  const name = input.patientName.trim();
  const email = normalizeVoiceEmail(input.email ?? "") ?? (input.email?.trim() || null);

  if (name.length < 2 || !normalizeIndianMobile(phone)) {
    return { patientId: null, created: false };
  }

  const findId = options.useSupabase
    ? findPatientIdByPhoneSupabase
    : findPatientIdByPhonePrisma;

  const existingId = await findId(phone);
  if (existingId) {
    return { patientId: existingId, created: false };
  }

  const patientCode = await generatePatientCode();

  try {
    if (options.useSupabase) {
      const row = (await supabaseCreate("patient", {
        patientCode,
        name,
        phone,
        email,
        gender: null,
        dateOfBirth: null,
        address: null,
        medicalNotes: null,
        treatmentHistory: null,
      })) as { id: string; name: string; patientCode: string };

      await createNotification({
        type: "NEW_PATIENT",
        title: "New patient registered",
        message: `${row.name} (${row.patientCode}) — confirmed appointment`,
        link: "/admin/patients",
      });

      return { patientId: row.id, created: true };
    }

    const patient = await prisma.patient.create({
      data: {
        patientCode,
        name,
        phone,
        email,
      },
    });

    await createNotification({
      type: "NEW_PATIENT",
      title: "New patient registered",
      message: `${patient.name} (${patient.patientCode}) — confirmed appointment`,
      link: "/admin/patients",
    });

    return { patientId: patient.id, created: true };
  } catch (e) {
    console.error("ensurePatientForConfirmedAppointment:", e);
    const retryId = await findId(phone);
    return { patientId: retryId, created: false };
  }
}
