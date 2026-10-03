type ApptRow = {
  id: string;
  appointmentCode?: string;
  appointmentDate: string | Date;
  treatmentName: string;
  status: string;
  doctor?: { name: string | null } | null;
};

export type ProfileTreatmentRow = {
  id: string;
  treatmentName: string;
  doctorName: string | null;
  treatmentDate: string;
  status: string;
  notes: string | null;
  fromAppointment?: boolean;
};

export type ProfileMessageRow = {
  id: string;
  at: string;
  title: string;
  detail: string | null;
};

function parseApptDate(d: string | Date): Date {
  return typeof d === "string" ? new Date(d) : d;
}

export function treatmentsFromAppointments(appts: ApptRow[]): ProfileTreatmentRow[] {
  return appts
    .filter((a) => a.status !== "CANCELLED" && a.status !== "NO_SHOW")
    .map((a) => ({
      id: `appt-${a.id}`,
      treatmentName: a.treatmentName,
      doctorName: a.doctor?.name ?? null,
      treatmentDate: parseApptDate(a.appointmentDate).toISOString(),
      status: a.status === "COMPLETED" ? "COMPLETED" : a.status,
      notes: a.appointmentCode ? `Appointment ${a.appointmentCode}` : "From appointment",
      fromAppointment: true,
    }));
}

export function mergeTreatmentLists(
  clinicalRecords: ProfileTreatmentRow[],
  fromAppointments: ProfileTreatmentRow[],
): ProfileTreatmentRow[] {
  const seen = new Set<string>();
  const out: ProfileTreatmentRow[] = [];

  for (const t of [...clinicalRecords, ...fromAppointments]) {
    const day = t.treatmentDate.slice(0, 10);
    const key = `${day}|${t.treatmentName.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }

  return out.sort(
    (a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime(),
  );
}

export function messagesFromAppointments(appts: ApptRow[]): ProfileMessageRow[] {
  return appts.map((a) => ({
    id: `appt-msg-${a.id}`,
    at: parseApptDate(a.appointmentDate).toISOString(),
    title: `Appointment — ${a.treatmentName} (${a.status})`,
    detail: a.appointmentCode ? `Reference: ${a.appointmentCode}` : null,
  }));
}

export function mergeMessages(
  activities: ProfileMessageRow[],
  fromAppointments: ProfileMessageRow[],
): ProfileMessageRow[] {
  const byId = new Map<string, ProfileMessageRow>();
  for (const m of [...activities, ...fromAppointments]) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}
