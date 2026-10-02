import { addDays, endOfDay, startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type PatientDashboardStats = {
  totalPatients: number;
  newPatients: number;
  returningPatients: number;
  activePatients: number;
  followUpsDue: number;
};

export async function getPatientDashboardStats(): Promise<PatientDashboardStats> {
  const now = new Date();
  const thirtyAgo = subDays(now, 30);
  const todayEnd = endOfDay(now);

  if (useSupabaseCrud()) {
    try {
      const sb = await getAdminSupabaseClient();
      const [totalRes, newRes, activeRes, apptRes, treatRes] = await Promise.all([
        sb
          .from("Patient")
          .select("*", { count: "exact", head: true })
          .neq("status", "ARCHIVED"),
        sb
          .from("Patient")
          .select("*", { count: "exact", head: true })
          .gte("createdAt", thirtyAgo.toISOString()),
        sb
          .from("Patient")
          .select("*", { count: "exact", head: true })
          .eq("status", "ACTIVE"),
        sb.from("Appointment").select("patientId, status").not("patientId", "is", null),
        sb
          .from("PatientTreatment")
          .select("*", { count: "exact", head: true })
          .lte("followUpDate", todayEnd.toISOString())
          .gte("followUpDate", startOfDay(now).toISOString()),
      ]);

      const appts = apptRes.data ?? [];
      const completedByPatient = new Map<string, number>();
      for (const a of appts) {
        const pid = a.patientId as string;
        if (!pid) continue;
        if (a.status === "COMPLETED") {
          completedByPatient.set(pid, (completedByPatient.get(pid) ?? 0) + 1);
        }
      }
      let returning = 0;
      for (const count of completedByPatient.values()) {
        if (count >= 2) returning += 1;
      }

      return {
        totalPatients: totalRes.count ?? 0,
        newPatients: newRes.count ?? 0,
        returningPatients: returning,
        activePatients: activeRes.count ?? 0,
        followUpsDue: treatRes.count ?? 0,
      };
    } catch {
      return emptyStats();
    }
  }

  const [totalPatients, newPatients, activePatients, followUpsDue, completedGroups] =
    await Promise.all([
      prisma.patient.count({ where: { status: { not: "ARCHIVED" } } }),
      prisma.patient.count({ where: { createdAt: { gte: thirtyAgo } } }),
      prisma.patient.count({ where: { status: "ACTIVE" } }),
      prisma.patientTreatment.count({
        where: {
          followUpDate: { lte: todayEnd, gte: startOfDay(now) },
        },
      }),
      prisma.appointment.groupBy({
        by: ["patientId"],
        where: { patientId: { not: null }, status: "COMPLETED" },
        _count: { _all: true },
      }),
    ]);

  const returningPatients = completedGroups.filter((g) => g._count._all >= 2).length;

  return {
    totalPatients,
    newPatients,
    returningPatients,
    activePatients,
    followUpsDue,
  };
}

function emptyStats(): PatientDashboardStats {
  return {
    totalPatients: 0,
    newPatients: 0,
    returningPatients: 0,
    activePatients: 0,
    followUpsDue: 0,
  };
}

export type PatientListFilters = {
  q?: string;
  status?: string;
  filter?: string;
  branchId?: string;
  doctorId?: string;
  page: number;
  limit: number;
};

export type PatientListRow = {
  id: string;
  patientCode: string;
  name: string;
  profilePhoto: string | null;
  age: number | null;
  gender: string | null;
  phone: string;
  email: string | null;
  branchName: string | null;
  lastVisit: string | null;
  nextAppointment: string | null;
  status: string;
};

export async function listPatientsEnriched(filters: PatientListFilters): Promise<{
  items: PatientListRow[];
  total: number;
}> {
  const skip = (filters.page - 1) * filters.limit;
  const q = filters.q?.trim();

  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  else where.status = { not: "ARCHIVED" };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
      { patientCode: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.filter === "new") {
    where.createdAt = { gte: subDays(new Date(), 30) };
  }
  if (filters.filter === "follow_up") {
    where.status = "FOLLOW_UP_REQUIRED";
  }
  if (filters.filter === "inactive") {
    where.status = "INACTIVE";
  }

  const [rows, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
      include: {
        preferredBranch: { select: { name: true } },
        appointments: {
          orderBy: { appointmentDate: "desc" },
          take: 20,
          include: { branch: { select: { name: true } }, doctor: { select: { name: true } } },
        },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  const items: PatientListRow[] = rows.map((p) => {
    const now = startOfDay(new Date());
    const past = p.appointments.filter(
      (a) => startOfDay(a.appointmentDate) < now || a.status === "COMPLETED",
    );
    const future = p.appointments
      .filter(
        (a) =>
          startOfDay(a.appointmentDate) >= now &&
          (a.status === "PENDING" || a.status === "CONFIRMED"),
      )
      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());

    const last = past[0];
    const next = future[0];

    let branchName = p.preferredBranch?.name ?? null;
    if (!branchName && last?.branch?.name) branchName = last.branch.name;

    const dobAge =
      p.dateOfBirth != null
        ? Math.floor(
            (Date.now() - p.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
          )
        : null;

    return {
      id: p.id,
      patientCode: p.patientCode,
      name: p.name,
      profilePhoto: p.profilePhoto,
      age: dobAge,
      gender: p.gender,
      phone: p.phone,
      email: p.email,
      branchName,
      lastVisit: last ? last.appointmentDate.toISOString() : null,
      nextAppointment: next ? next.appointmentDate.toISOString() : null,
      status: p.status,
    };
  });

  let filtered = items;
  if (filters.filter === "upcoming") {
    filtered = items.filter((i) => i.nextAppointment);
  }
  if (filters.filter === "returning") {
    filtered = items.filter((_, idx) => {
      const p = rows[idx];
      return p.appointments.filter((a) => a.status === "COMPLETED").length >= 2;
    });
  }

  return { items: filtered, total };
}

export async function findDuplicatePatients(phone: string, email?: string | null) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length < 10) return [];

  if (useSupabaseCrud()) {
    try {
      const sb = await getAdminSupabaseClient();
      const { data } = await sb.from("Patient").select("id, patientCode, name, phone, email, status");
      return (data ?? [])
        .filter((p) => {
          if (String(p.status) === "ARCHIVED") return false;
          const pDigits = String(p.phone ?? "").replace(/\D/g, "").slice(-10);
          if (pDigits === digits) return true;
          if (email?.trim() && p.email && String(p.email).toLowerCase() === email.trim().toLowerCase()) {
            return true;
          }
          return false;
        })
        .slice(0, 5)
        .map((p) => ({
          id: String(p.id),
          patientCode: String(p.patientCode),
          name: String(p.name),
          phone: String(p.phone),
          email: (p.email as string | null) ?? null,
        }));
    } catch {
      return [];
    }
  }

  const or: object[] = [{ phone: { contains: digits } }];
  if (email?.trim()) {
    or.push({ email: { equals: email.trim(), mode: "insensitive" } });
  }

  return prisma.patient.findMany({
    where: { OR: or, status: { not: "ARCHIVED" } },
    select: { id: true, patientCode: true, name: true, phone: true, email: true },
    take: 5,
  });
}
