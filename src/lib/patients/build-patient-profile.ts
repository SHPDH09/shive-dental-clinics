import { format, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { patientAgeFromDob } from "@/lib/patients/patient-age";
import { canViewPatientClinical, stripClinicalFields } from "@/lib/patients/patient-access";
import {
  mergeMessages,
  mergeTreatmentLists,
  messagesFromAppointments,
  treatmentsFromAppointments,
} from "@/lib/patients/profile-visit-records";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { supabaseFindUnique, useSupabaseCrud } from "@/lib/supabase/crud";

export async function getPatientProfileForAdmin(
  patientId: string,
  role: string | null | undefined,
) {
  if (useSupabaseCrud()) {
    return getPatientProfileSupabase(patientId, role);
  }
  return getPatientProfile(patientId, role);
}

type ApptRow = {
  id: string;
  appointmentCode?: string;
  appointmentDate: string | Date;
  appointmentTime: string;
  treatmentName: string;
  status: string;
  doctor?: { name: string | null } | null;
  branch?: { name: string | null } | null;
};

function parseApptDate(d: string | Date): Date {
  return typeof d === "string" ? new Date(d) : d;
}

function computeOverviewFromAppts(
  appts: ApptRow[],
  treatments: { treatmentName: string; doctorName: string | null; status: string }[],
  payments: { amountBilled: number; amountPaid: number }[],
) {
  const now = startOfDay(new Date());
  const totalAppointments = appts.length;
  const completedAppointments = appts.filter((a) => a.status === "COMPLETED").length;
  const cancelledAppointments = appts.filter((a) => a.status === "CANCELLED").length;

  const past = appts
    .filter((a) => {
      const dt = startOfDay(parseApptDate(a.appointmentDate));
      return dt < now || a.status === "COMPLETED";
    })
    .sort(
      (a, b) =>
        parseApptDate(b.appointmentDate).getTime() - parseApptDate(a.appointmentDate).getTime(),
    );

  const future = appts
    .filter((a) => {
      const dt = startOfDay(parseApptDate(a.appointmentDate));
      return dt >= now && (a.status === "PENDING" || a.status === "CONFIRMED");
    })
    .sort(
      (a, b) =>
        parseApptDate(a.appointmentDate).getTime() - parseApptDate(b.appointmentDate).getTime(),
    );

  const lastVisit = past[0] ?? null;
  const nextAppt = future[0] ?? null;
  const currentTreatment = treatments.find((t) => t.status === "IN_PROGRESS" || t.status === "PLANNED") ?? treatments[0] ?? null;

  const totalBilled = payments.reduce((s, p) => s + p.amountBilled, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0);

  return {
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    lastVisit: lastVisit
      ? {
          date: parseApptDate(lastVisit.appointmentDate).toISOString(),
          treatment: lastVisit.treatmentName,
          doctor: lastVisit.doctor?.name ?? null,
        }
      : null,
    nextAppointment: nextAppt
      ? {
          id: nextAppt.id,
          date: parseApptDate(nextAppt.appointmentDate).toISOString(),
          time: nextAppt.appointmentTime,
          treatment: nextAppt.treatmentName,
          doctor: nextAppt.doctor?.name ?? null,
          branch: nextAppt.branch?.name ?? null,
          status: nextAppt.status,
        }
      : null,
    currentTreatment: currentTreatment
      ? {
          name: currentTreatment.treatmentName,
          doctor: currentTreatment.doctorName,
          status: currentTreatment.status,
        }
      : null,
    paymentsSummary: {
      totalBilled,
      totalPaid,
      pending: Math.max(0, totalBilled - totalPaid),
    },
  };
}

async function getPatientProfileSupabase(patientId: string, role: string | null | undefined) {
  const clinical = canViewPatientClinical(role);
  const row = await supabaseFindUnique("patient", patientId);
  if (!row) return null;

  const p = row as Record<string, unknown>;
  const phone = String(p.phone ?? "");
  const digits = phone.replace(/\D/g, "").slice(-10);
  const sb = await getAdminSupabaseClient();

  let apptRows: Record<string, unknown>[] = [];
  const byId = await sb
    .from("Appointment")
    .select("*")
    .eq("patientId", patientId)
    .order("appointmentDate", { ascending: false })
    .limit(40);
  apptRows = byId.data ?? [];

  if (apptRows.length === 0 && digits.length >= 10) {
    const byPhone = await sb
      .from("Appointment")
      .select("*")
      .ilike("phone", `%${digits}%`)
      .order("appointmentDate", { ascending: false })
      .limit(40);
    apptRows = byPhone.data ?? [];
  }

  const doctorIds = [...new Set(apptRows.map((a) => a.doctorId).filter(Boolean))] as string[];
  const branchIds = [...new Set(apptRows.map((a) => a.branchId).filter(Boolean))] as string[];
  const doctorNames = new Map<string, string>();
  const branchNames = new Map<string, string>();

  if (doctorIds.length) {
    const { data: doctors } = await sb.from("Doctor").select("id, name").in("id", doctorIds);
    for (const d of doctors ?? []) doctorNames.set(String(d.id), String(d.name));
  }
  if (branchIds.length) {
    const { data: branches } = await sb.from("Branch").select("id, name").in("id", branchIds);
    for (const b of branches ?? []) branchNames.set(String(b.id), String(b.name));
  }

  let preferredBranch: { name: string } | null = null;
  if (p.preferredBranchId) {
    const { data: br } = await sb
      .from("Branch")
      .select("name")
      .eq("id", String(p.preferredBranchId))
      .maybeSingle();
    if (br?.name) preferredBranch = { name: String(br.name) };
  }

  let assignedDoctor: { name: string } | null = null;
  if (p.assignedDoctorId) {
    const { data: dr } = await sb
      .from("Doctor")
      .select("name")
      .eq("id", String(p.assignedDoctorId))
      .maybeSingle();
    if (dr?.name) assignedDoctor = { name: String(dr.name) };
  }

  const appts: ApptRow[] = apptRows.map((a) => ({
    id: String(a.id),
    appointmentCode: a.appointmentCode ? String(a.appointmentCode) : undefined,
    appointmentDate: String(a.appointmentDate),
    appointmentTime: String(a.appointmentTime ?? ""),
    treatmentName: String(a.treatmentName ?? ""),
    status: String(a.status ?? "PENDING"),
    doctor: a.doctorId ? { name: doctorNames.get(String(a.doctorId)) ?? null } : null,
    branch: a.branchId ? { name: branchNames.get(String(a.branchId)) ?? null } : null,
  }));

  let treatmentRows: Record<string, unknown>[] = [];
  let documentRows: Record<string, unknown>[] = [];
  let paymentRows: Record<string, unknown>[] = [];
  let activityRows: Record<string, unknown>[] = [];

  try {
    const t = await sb
      .from("PatientTreatment")
      .select("*")
      .eq("patientId", patientId)
      .order("treatmentDate", { ascending: false });
    if (t.error) console.warn("PatientTreatment load:", t.error.message);
    treatmentRows = t.data ?? [];
  } catch {
    /* table may not exist yet */
  }
  try {
    const d = await sb.from("PatientDocument").select("*").eq("patientId", patientId);
    documentRows = d.data ?? [];
  } catch {
    /* ignore */
  }
  try {
    const pay = await sb.from("PatientPayment").select("*").eq("patientId", patientId);
    paymentRows = pay.data ?? [];
  } catch {
    /* ignore */
  }
  try {
    const act = await sb
      .from("PatientActivity")
      .select("*")
      .eq("patientId", patientId)
      .order("at", { ascending: false })
      .limit(50);
    activityRows = act.data ?? [];
  } catch {
    /* ignore */
  }

  const dbTreatments = treatmentRows.map((t) => ({
    id: String(t.id),
    treatmentName: String(t.treatmentName ?? ""),
    doctorName: (t.doctorName as string | null) ?? null,
    treatmentDate: String(t.treatmentDate),
    status: String(t.status ?? "COMPLETED"),
    notes: (t.notes as string | null) ?? null,
    fromAppointment: false as const,
  }));

  const apptVisits = treatmentsFromAppointments(appts);
  const treatments = clinical
    ? mergeTreatmentLists(dbTreatments, apptVisits)
    : apptVisits;

  const payments = paymentRows.map((pay) => ({
    id: String(pay.id),
    treatmentName: (pay.treatmentName as string | null) ?? null,
    amountBilled: Number(pay.amountBilled ?? 0),
    amountPaid: Number(pay.amountPaid ?? 0),
    status: String(pay.status ?? "PENDING"),
  }));

  const overview = computeOverviewFromAppts(
    appts,
    treatments.map((t) => ({
      treatmentName: t.treatmentName,
      doctorName: t.doctorName,
      status: t.status,
    })),
    payments,
  );

  const createdAt = p.createdAt ? new Date(String(p.createdAt)) : new Date();
  const timeline = buildTimeline({
    createdAt,
    appointments: appts.map((a) => ({
      appointmentDate: parseApptDate(a.appointmentDate),
      treatmentName: a.treatmentName,
      status: a.status,
    })),
    treatments: treatmentRows.map((t) => ({
      treatmentDate: new Date(String(t.treatmentDate)),
      treatmentName: String(t.treatmentName),
      status: String(t.status),
    })),
    payments: paymentRows.map((pay) => ({
      createdAt: new Date(String(pay.createdAt ?? Date.now())),
      amountPaid: pay.amountPaid,
      status: String(pay.status),
    })),
    activities: activityRows.map((a) => ({
      at: new Date(String(a.at ?? a.createdAt ?? Date.now())),
      kind: String(a.kind),
      title: String(a.title),
    })),
  });

  const dob = p.dateOfBirth ? new Date(String(p.dateOfBirth)) : null;

  const base = {
    id: String(p.id),
    patientCode: String(p.patientCode ?? ""),
    name: String(p.name ?? ""),
    phone,
    email: (p.email as string | null) ?? null,
    gender: (p.gender as string | null) ?? null,
    dateOfBirth: dob?.toISOString() ?? null,
    age: patientAgeFromDob(dob),
    profilePhoto: (p.profilePhoto as string | null) ?? null,
    address: (p.address as string | null) ?? null,
    city: (p.city as string | null) ?? null,
    state: (p.state as string | null) ?? null,
    pinCode: (p.pinCode as string | null) ?? null,
    emergencyContactName: (p.emergencyContactName as string | null) ?? null,
    emergencyContactPhone: (p.emergencyContactPhone as string | null) ?? null,
    preferredBranch,
    assignedDoctor,
    commWhatsApp: Boolean(p.commWhatsApp ?? true),
    commPhone: Boolean(p.commPhone ?? true),
    commEmail: Boolean(p.commEmail ?? false),
    status: String(p.status ?? "ACTIVE"),
    consent: p.consent ?? {},
    createdAt: createdAt.toISOString(),
    overview,
    appointments: appts.map((a) => ({
      id: a.id,
      appointmentCode: a.appointmentCode,
      date: parseApptDate(a.appointmentDate).toISOString(),
      time: a.appointmentTime,
      doctor: a.doctor?.name ?? null,
      service: a.treatmentName,
      branch: a.branch?.name ?? null,
      status: a.status,
    })),
    treatments,
    documents: clinical
      ? documentRows.map((d) => ({
          id: String(d.id),
          category: String(d.category ?? "OTHER"),
          title: (d.title as string | null) ?? null,
          fileName: String(d.fileName ?? ""),
          fileUrl: String(d.fileUrl ?? ""),
          mimeType: (d.mimeType as string | null) ?? null,
          sizeBytes: (d.sizeBytes as number | null) ?? null,
          createdAt: String(d.createdAt ?? new Date().toISOString()),
        }))
      : [],
    payments,
    messages: mergeMessages(
      activityRows.map((a) => ({
        id: String(a.id),
        at: String(a.at ?? new Date().toISOString()),
        title: String(a.title),
        detail: (a.detail as string | null) ?? null,
      })),
      messagesFromAppointments(appts),
    ),
    notes: (p.medicalNotes as string | null) ?? null,
    timeline,
    access: { clinical },
  };

  return stripClinicalFields(
    {
      ...base,
      allergies: (p.allergies as string | null) ?? null,
      dentalHistory: (p.dentalHistory as string | null) ?? null,
      diagnosis: (p.diagnosis as string | null) ?? null,
      treatmentPlan: (p.treatmentPlan as string | null) ?? null,
      followUpInstructions: (p.followUpInstructions as string | null) ?? null,
      examinationNotes: (p.examinationNotes as string | null) ?? null,
    },
    clinical,
  );
}

export async function getPatientProfile(patientId: string, role: string | null | undefined) {
  const clinical = canViewPatientClinical(role);

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      preferredBranch: true,
      assignedDoctor: { select: { id: true, name: true, image: true } },
      appointments: {
        orderBy: { appointmentDate: "desc" },
        include: {
          doctor: { select: { name: true } },
          branch: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
      treatments: { orderBy: { treatmentDate: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { at: "desc" }, take: 50 },
    },
  });

  if (!patient) return null;

  const appts = patient.appointments;
  const payments = patient.payments;
  const overview = computeOverviewFromAppts(
    appts.map((a) => ({
      id: a.id,
      appointmentDate: a.appointmentDate,
      appointmentTime: a.appointmentTime,
      treatmentName: a.treatmentName,
      status: a.status,
      doctor: a.doctor,
      branch: a.branch,
    })),
    patient.treatments.map((t) => ({
      treatmentName: t.treatmentName,
      doctorName: t.doctorName,
      status: t.status,
    })),
    payments.map((pay) => ({
      amountBilled: Number(pay.amountBilled),
      amountPaid: Number(pay.amountPaid),
    })),
  );

  const timeline = buildTimeline(patient);

  const base = {
    id: patient.id,
    patientCode: patient.patientCode,
    name: patient.name,
    phone: patient.phone,
    email: patient.email,
    gender: patient.gender,
    dateOfBirth: patient.dateOfBirth?.toISOString() ?? null,
    age: patientAgeFromDob(patient.dateOfBirth),
    profilePhoto: patient.profilePhoto,
    address: patient.address,
    city: patient.city,
    state: patient.state,
    pinCode: patient.pinCode,
    emergencyContactName: patient.emergencyContactName,
    emergencyContactPhone: patient.emergencyContactPhone,
    preferredBranch: patient.preferredBranch,
    assignedDoctor: patient.assignedDoctor,
    commWhatsApp: patient.commWhatsApp,
    commPhone: patient.commPhone,
    commEmail: patient.commEmail,
    status: patient.status,
    consent: patient.consent,
    createdAt: patient.createdAt.toISOString(),
    overview,
    appointments: appts.map((a) => ({
      id: a.id,
      appointmentCode: a.appointmentCode,
      date: a.appointmentDate.toISOString(),
      time: a.appointmentTime,
      doctor: a.doctor?.name ?? null,
      service: a.treatmentName,
      branch: a.branch?.name ?? null,
      status: a.status,
    })),
    treatments: (() => {
      const dbTreatments = clinical
        ? patient.treatments.map((t) => ({
            id: t.id,
            treatmentName: t.treatmentName,
            doctorName: t.doctorName,
            treatmentDate: t.treatmentDate.toISOString(),
            notes: t.notes,
            status: t.status,
            fromAppointment: false as const,
          }))
        : [];
      const apptVisits = treatmentsFromAppointments(
        appts.map((a) => ({
          id: a.id,
          appointmentCode: a.appointmentCode,
          appointmentDate: a.appointmentDate,
          treatmentName: a.treatmentName,
          status: a.status,
          doctor: a.doctor,
        })),
      );
      return clinical ? mergeTreatmentLists(dbTreatments, apptVisits) : apptVisits;
    })(),
    documents: clinical
      ? patient.documents.map((d) => ({
          id: d.id,
          category: d.category,
          title: d.title,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          mimeType: d.mimeType,
          sizeBytes: d.sizeBytes,
          createdAt: d.createdAt.toISOString(),
        }))
      : [],
    payments: payments.map((p) => ({
      id: p.id,
      treatmentName: p.treatmentName,
      amountBilled: Number(p.amountBilled),
      amountPaid: Number(p.amountPaid),
      method: p.method,
      status: p.status,
      invoiceRef: p.invoiceRef,
      paidAt: p.paidAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    messages: mergeMessages(
      patient.activities.map((a) => ({
        id: a.id,
        at: a.at.toISOString(),
        title: a.title,
        detail: a.detail,
      })),
      messagesFromAppointments(
        appts.map((a) => ({
          id: a.id,
          appointmentCode: a.appointmentCode,
          appointmentDate: a.appointmentDate,
          treatmentName: a.treatmentName,
          status: a.status,
          doctor: a.doctor,
        })),
      ),
    ),
    notes: patient.medicalNotes,
    timeline,
    access: { clinical },
  };

  return stripClinicalFields(
    {
      ...base,
      allergies: patient.allergies,
      dentalHistory: patient.dentalHistory,
      diagnosis: patient.diagnosis,
      treatmentPlan: patient.treatmentPlan,
      followUpInstructions: patient.followUpInstructions,
      examinationNotes: patient.examinationNotes,
    },
    clinical,
  );
}

function buildTimeline(patient: {
  createdAt: Date;
  appointments: { appointmentDate: Date; treatmentName: string; status: string }[];
  treatments: { treatmentDate: Date; treatmentName: string; status: string }[];
  payments: { createdAt: Date; amountPaid: unknown; status: string }[];
  activities: { at: Date; kind: string; title: string }[];
}) {
  const events: { at: Date; kind: string; title: string }[] = [];

  events.push({
    at: patient.createdAt,
    kind: "created",
    title: "Patient registered",
  });

  for (const a of patient.appointments) {
    events.push({
      at: a.appointmentDate,
      kind: "appointment",
      title: `Appointment — ${a.treatmentName} (${a.status})`,
    });
  }
  for (const t of patient.treatments) {
    events.push({
      at: t.treatmentDate,
      kind: "treatment",
      title: `${t.treatmentName} — ${t.status}`,
    });
  }
  for (const p of patient.payments) {
    events.push({
      at: p.createdAt,
      kind: "payment",
      title: `Payment ${p.status} — ₹${Number(p.amountPaid)}`,
    });
  }
  for (const act of patient.activities) {
    events.push({ at: act.at, kind: act.kind, title: act.title });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());

  return events.slice(0, 40).map((e) => ({
    at: e.at.toISOString(),
    kind: e.kind,
    title: e.title,
    label: format(e.at, "dd MMM yyyy"),
  }));
}
