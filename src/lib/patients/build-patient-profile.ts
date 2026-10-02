import { format, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { patientAgeFromDob } from "@/lib/patients/patient-age";
import { canViewPatientClinical, stripClinicalFields } from "@/lib/patients/patient-access";

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

  const now = startOfDay(new Date());
  const appts = patient.appointments;
  const totalAppointments = appts.length;
  const completedAppointments = appts.filter((a) => a.status === "COMPLETED").length;
  const cancelledAppointments = appts.filter((a) => a.status === "CANCELLED").length;

  const past = appts.filter((a) => startOfDay(a.appointmentDate) < now || a.status === "COMPLETED");
  const future = appts
    .filter(
      (a) =>
        startOfDay(a.appointmentDate) >= now &&
        (a.status === "PENDING" || a.status === "CONFIRMED"),
    )
    .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());

  const lastVisit = past[0] ?? null;
  const nextAppt = future[0] ?? null;

  const currentTreatment =
    patient.treatments.find((t) => t.status === "IN_PROGRESS" || t.status === "PLANNED") ??
    patient.treatments[0] ??
    null;

  const payments = patient.payments;
  const totalBilled = payments.reduce((s, p) => s + Number(p.amountBilled), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amountPaid), 0);

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
    overview: {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      lastVisit: lastVisit
        ? {
            date: lastVisit.appointmentDate.toISOString(),
            treatment: lastVisit.treatmentName,
            doctor: lastVisit.doctor?.name ?? null,
          }
        : null,
      nextAppointment: nextAppt
        ? {
            id: nextAppt.id,
            date: nextAppt.appointmentDate.toISOString(),
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
    },
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
    treatments: clinical
      ? patient.treatments.map((t) => ({
          id: t.id,
          treatmentName: t.treatmentName,
          doctorName: t.doctorName,
          treatmentDate: t.treatmentDate.toISOString(),
          toothArea: t.toothArea,
          diagnosis: t.diagnosis,
          notes: t.notes,
          followUpDate: t.followUpDate?.toISOString() ?? null,
          status: t.status,
        }))
      : [],
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
    messages: patient.activities
      .filter((a) => a.kind === "message" || a.kind === "communication")
      .map((a) => ({
        id: a.id,
        at: a.at.toISOString(),
        title: a.title,
        detail: a.detail,
      })),
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
