import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  getDay,
  startOfMonth,
} from "date-fns";
import { emptyReportsPayload } from "@/lib/reports/build-reports";
import type { ReportFilters, ReportsAccess, ReportsPayload } from "@/lib/reports/types";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ApptRow = {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  phone: string;
  branchId: string | null;
  doctorId: string | null;
  serviceId: string | null;
  treatmentName: string;
  notes: string | null;
};

type LeadRow = {
  id: string;
  status: string;
  source: string | null;
  createdAt: string;
};

function parseAppointmentHour(time: string): number | null {
  const m12 = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const ap = m12[3].toUpperCase();
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return h;
  }
  const m24 = time.match(/^(\d{1,2}):(\d{2})/);
  if (m24) return parseInt(m24[1], 10);
  return null;
}

async function fetchAll<T>(
  table: string,
  build: (from: number, to: number) => Promise<{ data: T[] | null; error: Error | null }>,
  pageSize = 1000,
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  for (;;) {
    const to = from + pageSize - 1;
    const { data, error } = await build(from, to);
    if (error) throw error;
    const batch = data ?? [];
    out.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

function apptInRange(a: ApptRow, filters: ReportFilters): boolean {
  const d = new Date(a.appointmentDate);
  if (d < filters.from || d > filters.to) return false;
  if (filters.branchId && a.branchId !== filters.branchId) return false;
  if (filters.doctorId && a.doctorId !== filters.doctorId) return false;
  if (filters.serviceId && a.serviceId !== filters.serviceId) return false;
  if (filters.appointmentStatus && a.status !== filters.appointmentStatus) return false;
  return true;
}

export async function buildReportsSupabase(
  filters: ReportFilters,
  access: ReportsAccess,
): Promise<ReportsPayload> {
  const sb = await getAdminSupabaseClient();
  const fromIso = filters.from.toISOString();
  const toIso = filters.to.toISOString();

  const settingsRow = await sb
    .from("ClinicSettings")
    .select("clinicName,showRevenueCard,monthlyRevenue")
    .eq("id", "default")
    .maybeSingle();
  if (settingsRow.error) throw settingsRow.error;

  const clinicName = String(settingsRow.data?.clinicName ?? "Shiv Dental Clinic");
  const revenueEnabled = Boolean(settingsRow.data?.showRevenueCard && access.revenue);

  const base = emptyReportsPayload(clinicName, filters, access, revenueEnabled);
  base.dbUnavailable = false;

  const [appointmentsRaw, leadsRaw, patientsTotal, patientsNew, branches, doctors, enquiriesCount] =
    await Promise.all([
      fetchAll<ApptRow>("Appointment", async (from, to) => {
        let q = sb
          .from("Appointment")
          .select(
            "id,appointmentDate,appointmentTime,status,phone,branchId,doctorId,serviceId,treatmentName,notes",
          )
          .gte("appointmentDate", fromIso)
          .lte("appointmentDate", toIso)
          .order("appointmentDate", { ascending: true })
          .range(from, to);
        if (filters.branchId) q = q.eq("branchId", filters.branchId);
        if (filters.doctorId) q = q.eq("doctorId", filters.doctorId);
        if (filters.serviceId) q = q.eq("serviceId", filters.serviceId);
        if (filters.appointmentStatus) q = q.eq("status", filters.appointmentStatus);
        const r = await q;
        return { data: r.data as ApptRow[] | null, error: r.error };
      }),
      fetchAll<LeadRow>("Lead", async (from, to) => {
        let q = sb
          .from("Lead")
          .select("id,status,source,createdAt")
          .gte("createdAt", fromIso)
          .lte("createdAt", toIso)
          .order("createdAt", { ascending: true })
          .range(from, to);
        if (filters.leadSource) q = q.eq("source", filters.leadSource);
        const r = await q;
        return { data: r.data as LeadRow[] | null, error: r.error };
      }),
      sb.from("Patient").select("*", { count: "exact", head: true }).then((r) => {
        if (r.error) throw r.error;
        return r.count ?? 0;
      }),
      sb
        .from("Patient")
        .select("*", { count: "exact", head: true })
        .gte("createdAt", fromIso)
        .lte("createdAt", toIso)
        .then((r) => {
          if (r.error) throw r.error;
          return r.count ?? 0;
        }),
      sb.from("Branch").select("id,name").then((r) => {
        if (r.error) throw r.error;
        return r.data ?? [];
      }),
      sb.from("Doctor").select("id,name").then((r) => {
        if (r.error) throw r.error;
        return r.data ?? [];
      }),
      sb
        .from("Enquiry")
        .select("*", { count: "exact", head: true })
        .gte("createdAt", fromIso)
        .lte("createdAt", toIso)
        .then((r) => {
          if (r.error && !/does not exist|PGRST205|Could not find the table/i.test(r.error.message)) {
            throw r.error;
          }
          return r.count ?? 0;
        }),
    ]);

  const appointmentsInRange = appointmentsRaw.filter((a) => apptInRange(a, filters));
  const branchNameById = new Map(branches.map((b) => [String(b.id), String(b.name)]));

  const statusCount = (s: string) => appointmentsInRange.filter((a) => a.status === s).length;
  const totalAppt = appointmentsInRange.length;
  const pending = statusCount("PENDING");
  const confirmed = statusCount("CONFIRMED");
  const completed = statusCount("COMPLETED");
  const cancelled = statusCount("CANCELLED");
  const noShow = statusCount("NO_SHOW");
  const completionRate = totalAppt > 0 ? Math.round((completed / totalAppt) * 100) : 0;

  const useWeeklyTrend = differenceInCalendarDays(filters.to, filters.from) > 45;
  const trendInterval = useWeeklyTrend
    ? eachMonthOfInterval({ start: startOfMonth(filters.from), end: filters.to })
    : eachDayOfInterval({ start: filters.from, end: filters.to });

  const trend = trendInterval.map((d) => {
    const label = useWeeklyTrend ? format(d, "MMM yyyy") : format(d, "MMM d");
    const count = appointmentsInRange.filter((a) => {
      const ad = new Date(a.appointmentDate);
      if (useWeeklyTrend) {
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
      }
      return format(ad, "yyyy-MM-dd") === format(d, "yyyy-MM-dd");
    }).length;
    return { label, count };
  });

  const statusDistribution = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]
    .map((status) => ({ status, count: statusCount(status) }))
    .filter((x) => x.count > 0);

  const hourCounts = new Map<number, number>();
  for (const a of appointmentsInRange) {
    const h = parseAppointmentHour(a.appointmentTime);
    if (h != null) hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
  }
  const peakHours = [...hourCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([h, count]) => ({
      hour: `${h.toString().padStart(2, "0")}:00`,
      count,
    }));

  const byDayOfWeek = DAY_NAMES.map((day, idx) => ({
    day,
    count: appointmentsInRange.filter((a) => getDay(new Date(a.appointmentDate)) === idx).length,
  }));

  const leadStatusCount = (s: string) => leadsRaw.filter((l) => l.status === s).length;
  const leadsTotal = leadsRaw.length;
  const convertedLeads = leadStatusCount("CONVERTED");
  const conversionRate = leadsTotal > 0 ? Math.round((convertedLeads / leadsTotal) * 100) : 0;

  const sourceMap = new Map<string, { count: number; converted: number }>();
  for (const l of leadsRaw) {
    const src = l.source ?? "OTHER";
    const cur = sourceMap.get(src) ?? { count: 0, converted: 0 };
    cur.count += 1;
    if (l.status === "CONVERTED") cur.converted += 1;
    sourceMap.set(src, cur);
  }
  const bySource = [...sourceMap.entries()].map(([source, v]) => ({
    source,
    count: v.count,
    converted: v.converted,
    conversionRate: v.count > 0 ? Math.round((v.converted / v.count) * 100) : 0,
  }));

  const activePatientPhones = new Set(appointmentsInRange.map((a) => a.phone.trim()));
  const phoneApptCount = new Map<string, number>();
  for (const a of appointmentsInRange) {
    const p = a.phone.trim();
    phoneApptCount.set(p, (phoneApptCount.get(p) ?? 0) + 1);
  }
  const returningPatients = [...phoneApptCount.values()].filter((c) => c >= 2).length;

  const serviceCounts = new Map<string, { appointments: number; completed: number }>();
  for (const a of appointmentsInRange) {
    const name = a.treatmentName || "Unknown";
    const cur = serviceCounts.get(name) ?? { appointments: 0, completed: 0 };
    cur.appointments += 1;
    if (a.status === "COMPLETED") cur.completed += 1;
    serviceCounts.set(name, cur);
  }
  const topServices = [...serviceCounts.entries()]
    .map(([name, v]) => ({ name, appointments: v.appointments, completed: v.completed }))
    .sort((a, b) => b.appointments - a.appointments)
    .slice(0, 12);

  const serviceMonthMap = new Map<string, number>();
  for (const a of appointmentsInRange) {
    const key = format(new Date(a.appointmentDate), "MMM yyyy");
    serviceMonthMap.set(key, (serviceMonthMap.get(key) ?? 0) + 1);
  }
  const monthlyTrend = [...serviceMonthMap.entries()].map(([label, count]) => ({ label, count }));

  const branchServiceMap = new Map<string, number>();
  for (const a of appointmentsInRange) {
    if (!a.branchId) continue;
    const key = `${a.branchId}::${a.treatmentName}`;
    branchServiceMap.set(key, (branchServiceMap.get(key) ?? 0) + 1);
  }
  const byBranchService = [...branchServiceMap.entries()]
    .map(([key, count]) => {
      const [branchId, service] = key.split("::");
      return {
        branch: branchNameById.get(branchId) ?? branchId,
        service,
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const doctorRows = doctors
    .filter((d) => !filters.doctorId || String(d.id) === filters.doctorId)
    .map((doc) => {
      const docAppts = appointmentsInRange.filter((a) => a.doctorId === doc.id);
      const total = docAppts.length;
      const comp = docAppts.filter((a) => a.status === "COMPLETED").length;
      const canc = docAppts.filter((a) => a.status === "CANCELLED").length;
      const ns = docAppts.filter((a) => a.status === "NO_SHOW").length;
      const svcIds = new Set(docAppts.map((a) => a.serviceId).filter(Boolean));
      const phones = new Set(docAppts.map((a) => a.phone.trim()));
      return {
        id: String(doc.id),
        name: String(doc.name),
        total,
        completed: comp,
        cancelled: canc,
        noShow: ns,
        completionRate: total > 0 ? Math.round((comp / total) * 100) : 0,
        servicesHandled: svcIds.size,
        patientCount: phones.size,
      };
    });

  const branchRows = branches
    .filter((b) => !filters.branchId || String(b.id) === filters.branchId)
    .map((branch) => {
      const bw = appointmentsInRange.filter((a) => a.branchId === branch.id);
      const appointments = bw.length;
      const completedB = bw.filter((a) => a.status === "COMPLETED").length;
      const cancelledB = bw.filter((a) => a.status === "CANCELLED").length;
      const doctorAppts = bw.filter((a) => a.doctorId).length;
      const phones = new Set(bw.map((a) => a.phone.trim()));
      const svcCounts = new Map<string, number>();
      for (const a of bw) {
        svcCounts.set(a.treatmentName, (svcCounts.get(a.treatmentName) ?? 0) + 1);
      }
      const topService =
        [...svcCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        id: String(branch.id),
        name: String(branch.name),
        appointments,
        patients: phones.size,
        newLeads: leadsTotal,
        completed: completedB,
        cancelled: cancelledB,
        topService,
        doctorAppointments: doctorAppts,
      };
    });

  const multiApptPhones = [...phoneApptCount.values()].filter((c) => c >= 2).length;
  const repeatAppointmentRate =
    phoneApptCount.size > 0 ? Math.round((multiApptPhones / phoneApptCount.size) * 100) : 0;

  const followUpAppointments = appointmentsInRange.filter((a) =>
    /follow\s*-?\s*up/i.test(a.treatmentName),
  ).length;

  const patientsNeedingFollowUp = appointmentsInRange.filter(
    (a) =>
      (a.status === "COMPLETED" || a.status === "CONFIRMED") &&
      (/follow/i.test(a.notes ?? "") || /follow/i.test(a.treatmentName)),
  ).length;

  const retentionMonths = eachMonthOfInterval({
    start: startOfMonth(filters.from),
    end: filters.to,
  });
  const retentionTrend = retentionMonths.map((m) => {
    const monthEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59);
    const inMonth = appointmentsInRange.filter((a) => {
      const ad = new Date(a.appointmentDate);
      return ad >= m && ad <= monthEnd;
    });
    const counts = new Map<string, number>();
    for (const a of inMonth) {
      const p = a.phone.trim();
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    const returning = [...counts.values()].filter((c) => c >= 2).length;
    const newP = inMonth.length > 0 ? counts.size - returning : 0;
    const rate = counts.size > 0 ? Math.round((returning / counts.size) * 100) : 0;
    return {
      label: format(m, "MMM yyyy"),
      new: Math.max(newP, 0),
      returning,
      repeatRate: rate,
    };
  });

  let summaryRevenue: string | null = null;
  if (revenueEnabled && settingsRow.data?.monthlyRevenue != null) {
    summaryRevenue = String(settingsRow.data.monthlyRevenue);
  }

  base.summary = {
    totalAppointments: totalAppt,
    totalPatients: patientsTotal,
    newLeads: leadStatusCount("NEW"),
    completedAppointments: completed,
    conversionRate,
    revenue: summaryRevenue,
  };
  base.appointments = {
    total: totalAppt,
    pending,
    confirmed,
    completed,
    cancelled,
    noShow,
    completionRate,
    trend,
    statusDistribution,
    peakHours,
    byDayOfWeek,
  };
  base.patients = {
    total: patientsTotal,
    newInRange: patientsNew,
    returning: returningPatients,
    activeInRange: activePatientPhones.size,
    byBranch: branchRows.map((b) => ({ branch: b.name, count: b.patients })),
    byAgeGroup: [],
    byGender: [],
    growthTrend: monthlyTrend,
    newVsReturningTrend: retentionTrend.map((r) => ({
      label: r.label,
      new: r.new,
      returning: r.returning,
    })),
  };
  base.leads = {
    total: leadsTotal,
    new: leadStatusCount("NEW"),
    contacted: leadStatusCount("CONTACTED"),
    followUp: leadStatusCount("FOLLOW_UP"),
    converted: convertedLeads,
    lost: leadStatusCount("LOST"),
    bySource,
    enquiriesInRange: enquiriesCount,
  };
  base.services = { topServices, monthlyTrend, byBranch: byBranchService };
  base.doctors = { rows: doctorRows.filter((d) => d.total > 0 || !filters.doctorId) };
  base.branches = { rows: branchRows };
  base.revenue = null;
  base.retention = {
    newPatients: patientsNew,
    returningPatients: returningPatients,
    repeatAppointmentRate,
    followUpAppointments,
    patientsNeedingFollowUp,
    monthlyTrend: retentionTrend,
  };

  return base;
}
