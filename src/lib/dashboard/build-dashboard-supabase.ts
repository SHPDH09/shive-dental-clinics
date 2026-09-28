import { endOfDay, startOfDay, subDays } from "date-fns";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";

export type DashboardPayload = {
  branchId: string | null;
  branchName: string | null;
  cards: {
    todayAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
    totalPatients: number;
    newLeads: number;
    conversionRate: number;
    monthlyRevenue: string | null;
  };
  doctorAvailability: { name: string; hours: string | null }[];
  charts: {
    appointmentsByDay: { date: string; count: number }[];
    leadFunnel: { status: string; count: number }[];
    popularServices: { name: string; count: number }[];
    patientGrowth: { date: string; count: number }[];
  };
};

export async function buildDashboardSupabase(branchId?: string): Promise<DashboardPayload> {
  const sb = await getAdminSupabaseClient();
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const since30 = subDays(new Date(), 30).toISOString();

  const [
    todayAppointments,
    pendingAppointments,
    completedAppointments,
    newLeads,
    leadsTotal,
    convertedLeads,
    patientsCount,
    settingsRow,
    branchRow,
    recentAppointments,
    leadsRows,
    patientsRecent,
  ] = await Promise.all([
    (async () => {
      let q = sb
        .from("Appointment")
        .select("*", { count: "exact", head: true })
        .gte("appointmentDate", todayStart.toISOString())
        .lte("appointmentDate", todayEnd.toISOString())
        .neq("status", "CANCELLED");
      if (branchId) q = q.eq("branchId", branchId);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    })(),
    (async () => {
      let q = sb.from("Appointment").select("*", { count: "exact", head: true }).eq("status", "PENDING");
      if (branchId) q = q.eq("branchId", branchId);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    })(),
    (async () => {
      let q = sb.from("Appointment").select("*", { count: "exact", head: true }).eq("status", "COMPLETED");
      if (branchId) q = q.eq("branchId", branchId);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    })(),
    sb.from("Lead").select("*", { count: "exact", head: true }).eq("status", "NEW").then((r) => {
      if (r.error) throw r.error;
      return r.count ?? 0;
    }),
    sb.from("Lead").select("*", { count: "exact", head: true }).then((r) => {
      if (r.error) throw r.error;
      return r.count ?? 0;
    }),
    sb.from("Lead").select("*", { count: "exact", head: true }).eq("status", "CONVERTED").then((r) => {
      if (r.error) throw r.error;
      return r.count ?? 0;
    }),
    branchId
      ? (async () => {
          const { data, error } = await sb.from("Appointment").select("phone").eq("branchId", branchId);
          if (error) throw error;
          return new Set((data ?? []).map((r) => String(r.phone))).size;
        })()
      : sb.from("Patient").select("*", { count: "exact", head: true }).then((r) => {
          if (r.error) throw r.error;
          return r.count ?? 0;
        }),
    sb.from("ClinicSettings").select("showRevenueCard,monthlyRevenue").eq("id", "default").maybeSingle(),
    branchId
      ? sb.from("Branch").select("id,name,doctorIds").eq("id", branchId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    (async () => {
      let q = sb
        .from("Appointment")
        .select("appointmentDate,treatmentName")
        .gte("appointmentDate", since30);
      if (branchId) q = q.eq("branchId", branchId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    })(),
    sb.from("Lead").select("status").then((r) => {
      if (r.error) throw r.error;
      return r.data ?? [];
    }),
    sb
      .from("Patient")
      .select("createdAt")
      .gte("createdAt", subDays(new Date(), 90).toISOString())
      .then((r) => {
        if (r.error) throw r.error;
        return r.data ?? [];
      }),
  ]);

  if (branchRow.error) throw branchRow.error;

  const conversionRate = leadsTotal > 0 ? Math.round((convertedLeads / leadsTotal) * 100) : 0;

  const byDay = new Map<string, number>();
  for (const row of recentAppointments) {
    const d = String(row.appointmentDate).slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const appointmentsByDay = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const serviceCounts = new Map<string, number>();
  for (const row of recentAppointments) {
    const name = String(row.treatmentName || "Unknown");
    serviceCounts.set(name, (serviceCounts.get(name) ?? 0) + 1);
  }
  const popularServices = [...serviceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const funnel = new Map<string, number>();
  for (const row of leadsRows) {
    const s = String(row.status ?? "UNKNOWN");
    funnel.set(s, (funnel.get(s) ?? 0) + 1);
  }
  const leadFunnel = [...funnel.entries()].map(([status, count]) => ({ status, count }));

  const growth = new Map<string, number>();
  for (const row of patientsRecent) {
    const d = String(row.createdAt).slice(0, 10);
    growth.set(d, (growth.get(d) ?? 0) + 1);
  }
  const patientGrowth = [...growth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  let doctorAvailability: { name: string; hours: string | null }[] = [];
  const branch = branchRow.data;
  if (branchId && branch) {
    const ids = Array.isArray(branch.doctorIds) ? (branch.doctorIds as string[]) : [];
    const { data: doctors, error } = await sb
      .from("Doctor")
      .select("id,name,consultationHours")
      .eq("enabled", true)
      .limit(20);
    if (error) throw error;
    doctorAvailability = (doctors ?? [])
      .filter((d) => ids.length === 0 || ids.includes(String(d.id)))
      .map((d) => ({
        name: String(d.name),
        hours: (d.consultationHours as string | null) ?? null,
      }));
  }

  const settings = settingsRow.data;

  return {
    branchId: branchId ?? null,
    branchName: branch?.name ? String(branch.name) : null,
    cards: {
      todayAppointments,
      pendingAppointments,
      completedAppointments,
      totalPatients: patientsCount,
      newLeads,
      conversionRate,
      monthlyRevenue:
        settings?.showRevenueCard && settings.monthlyRevenue != null
          ? String(settings.monthlyRevenue)
          : null,
    },
    doctorAvailability,
    charts: {
      appointmentsByDay,
      leadFunnel,
      popularServices,
      patientGrowth,
    },
  };
}
