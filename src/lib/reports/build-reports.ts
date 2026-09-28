import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  getDay,
  startOfMonth,
} from "date-fns";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReportFilters, ReportsAccess, ReportsPayload } from "@/lib/reports/types";
import { useSupabaseCrud } from "@/lib/supabase/crud";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function ageGroup(dob: Date | null, ref: Date): string | null {
  if (!dob) return null;
  const years = Math.floor((ref.getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
  if (years < 0) return null;
  if (years <= 12) return "0–12";
  if (years <= 18) return "13–18";
  if (years <= 35) return "19–35";
  if (years <= 50) return "36–50";
  if (years <= 65) return "51–65";
  return "65+";
}

function appointmentWhere(filters: ReportFilters): Prisma.AppointmentWhereInput {
  return {
    appointmentDate: { gte: filters.from, lte: filters.to },
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
    ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
    ...(filters.appointmentStatus ? { status: filters.appointmentStatus } : {}),
  };
}

function leadWhere(filters: ReportFilters): Prisma.LeadWhereInput {
  return {
    createdAt: { gte: filters.from, lte: filters.to },
    ...(filters.leadSource ? { source: filters.leadSource } : {}),
  };
}

export function emptyReportsPayload(
  clinicName: string,
  filters: ReportFilters,
  access: ReportsAccess,
  revenueEnabled: boolean,
): ReportsPayload {
  return {
    generatedAt: new Date().toISOString(),
    clinicName,
    filters: {
      preset: filters.preset,
      from: filters.from.toISOString(),
      to: filters.to.toISOString(),
      branchId: filters.branchId ?? null,
      doctorId: filters.doctorId ?? null,
      serviceId: filters.serviceId ?? null,
      appointmentStatus: filters.appointmentStatus ?? null,
      leadSource: filters.leadSource ?? null,
    },
    access,
    revenueEnabled,
    summary: {
      totalAppointments: 0,
      totalPatients: 0,
      newLeads: 0,
      completedAppointments: 0,
      conversionRate: 0,
      revenue: null,
    },
    appointments: {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      completionRate: 0,
      trend: [],
      statusDistribution: [],
      peakHours: [],
      byDayOfWeek: DAY_NAMES.map((day) => ({ day, count: 0 })),
    },
    patients: {
      total: 0,
      newInRange: 0,
      returning: 0,
      activeInRange: 0,
      byBranch: [],
      byAgeGroup: [],
      byGender: [],
      growthTrend: [],
      newVsReturningTrend: [],
    },
    leads: {
      total: 0,
      new: 0,
      contacted: 0,
      followUp: 0,
      converted: 0,
      lost: 0,
      bySource: [],
      enquiriesInRange: 0,
    },
    services: {
      topServices: [],
      monthlyTrend: [],
      byBranch: [],
    },
    doctors: { rows: [] },
    branches: { rows: [] },
    revenue: null,
    retention: {
      newPatients: 0,
      returningPatients: 0,
      repeatAppointmentRate: 0,
      followUpAppointments: 0,
      patientsNeedingFollowUp: 0,
      monthlyTrend: [],
    },
    dbUnavailable: true,
  };
}

/** Reports for admin UI — Supabase on Cloudflare, Prisma when DATABASE_URL is available. */
export async function buildReportsData(
  filters: ReportFilters,
  access: ReportsAccess,
): Promise<ReportsPayload> {
  if (useSupabaseCrud()) {
    const { buildReportsSupabase } = await import("@/lib/reports/build-reports-supabase");
    return buildReportsSupabase(filters, access);
  }

  const defaultClinicName = "Shiv Dental Clinic";
  const apptWhere = appointmentWhere(filters);
  const leadWhereClause = leadWhere(filters);

  try {
    const settings = await prisma.clinicSettings
      .findUnique({ where: { id: "default" } })
      .catch(() => null);
    const clinicName = settings?.clinicName ?? defaultClinicName;
    const revenueEnabled = Boolean(settings?.showRevenueCard && access.revenue);
    const [
      statusGroups,
      appointmentsInRange,
      leadsInRange,
      leadStatusGroups,
      leadSourceGroups,
      serviceGroups,
      branchApptGroups,
      doctors,
      branches,
      newPatientsCount,
      totalPatientsCount,
      enquiriesCount,
      completedWithService,
    ] = await Promise.all([
      prisma.appointment.groupBy({
        by: ["status"],
        _count: true,
        where: apptWhere,
      }),
      prisma.appointment.findMany({
        where: apptWhere,
        select: {
          id: true,
          appointmentDate: true,
          appointmentTime: true,
          status: true,
          phone: true,
          patientId: true,
          branchId: true,
          doctorId: true,
          serviceId: true,
          treatmentName: true,
          service: { select: { price: true, name: true } },
        },
      }),
      prisma.lead.findMany({ where: leadWhereClause }),
      prisma.lead.groupBy({
        by: ["status"],
        _count: true,
        where: leadWhereClause,
      }),
      prisma.lead.groupBy({
        by: ["source"],
        _count: true,
        where: leadWhereClause,
      }),
      prisma.appointment.groupBy({
        by: ["treatmentName"],
        _count: true,
        where: apptWhere,
        orderBy: { _count: { treatmentName: "desc" } },
        take: 15,
      }),
      prisma.appointment.groupBy({
        by: ["branchId"],
        _count: true,
        where: apptWhere,
      }),
      prisma.doctor.findMany({
        where: { enabled: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.branch.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.patient.count({
        where: { createdAt: { gte: filters.from, lte: filters.to } },
      }),
      prisma.patient.count(),
      prisma.enquiry.count({
        where: { createdAt: { gte: filters.from, lte: filters.to } },
      }),
      revenueEnabled
        ? prisma.appointment.findMany({
            where: { ...apptWhere, status: "COMPLETED" },
            select: {
              appointmentDate: true,
              branchId: true,
              doctorId: true,
              treatmentName: true,
              service: { select: { price: true, name: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const statusCount = (s: string) =>
      statusGroups.find((g) => g.status === s)?._count ?? 0;

    const totalAppt = appointmentsInRange.length;
    const pending = statusCount("PENDING");
    const confirmed = statusCount("CONFIRMED");
    const completed = statusCount("COMPLETED");
    const cancelled = statusCount("CANCELLED");
    const noShow = statusCount("NO_SHOW");
    const completionRate =
      totalAppt > 0 ? Math.round((completed / totalAppt) * 100) : 0;

    const daysSpan = differenceInCalendarDays(filters.to, filters.from) + 1;
    const useWeeklyTrend = daysSpan > 21;

    const trendMap = new Map<string, number>();
    for (const a of appointmentsInRange) {
      const key = useWeeklyTrend
        ? format(a.appointmentDate, "yyyy-'W'ww")
        : format(a.appointmentDate, "yyyy-MM-dd");
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }

    let trend: { label: string; count: number }[];
    if (!useWeeklyTrend) {
      const days = eachDayOfInterval({ start: filters.from, end: filters.to });
      trend = days.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        return { label: format(d, "MMM d"), count: trendMap.get(key) ?? 0 };
      });
    } else {
      trend = [...trendMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, count]) => ({ label, count }));
    }

    const hourBuckets = new Array(24).fill(0) as number[];
    for (const a of appointmentsInRange) {
      const h = parseAppointmentHour(a.appointmentTime);
      if (h != null && h >= 0 && h < 24) hourBuckets[h]++;
    }
    const peakHours = hourBuckets
      .map((count, hour) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        count,
      }))
      .filter((h) => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
      .sort((a, b) => a.hour.localeCompare(b.hour));

    const dowCounts = new Array(7).fill(0) as number[];
    for (const a of appointmentsInRange) {
      dowCounts[getDay(a.appointmentDate)]++;
    }
    const byDayOfWeek = DAY_NAMES.map((day, i) => ({ day, count: dowCounts[i] }));

    const leadStatusCount = (s: string) =>
      leadStatusGroups.find((g) => g.status === s)?._count ?? 0;

    const leadsTotal = leadsInRange.length;
    const convertedLeads = leadStatusCount("CONVERTED");
    const conversionRate =
      leadsTotal > 0 ? Math.round((convertedLeads / leadsTotal) * 100) : 0;

    const convertedBySource = await prisma.lead.groupBy({
      by: ["source"],
      _count: true,
      where: { ...leadWhereClause, status: "CONVERTED" },
    });

    const bySource = leadSourceGroups.map((g) => {
      const converted =
        convertedBySource.find((c) => c.source === g.source)?._count ?? 0;
      return {
        source: g.source,
        count: g._count,
        converted,
        conversionRate: g._count > 0 ? Math.round((converted / g._count) * 100) : 0,
      };
    });

    const phoneFirstAppt = new Map<string, Date>();
    for (const a of appointmentsInRange) {
      const key = a.phone.trim();
      const existing = phoneFirstAppt.get(key);
      if (!existing || a.appointmentDate < existing) {
        phoneFirstAppt.set(key, a.appointmentDate);
      }
    }

    const phonesInRange = new Set(appointmentsInRange.map((a) => a.phone.trim()));
    let returningPatients = 0;
    if (phonesInRange.size > 0) {
      const prior = await prisma.appointment.findMany({
        where: {
          phone: { in: [...phonesInRange] },
          appointmentDate: { lt: filters.from },
          ...(filters.branchId ? { branchId: filters.branchId } : {}),
        },
        select: { phone: true },
        distinct: ["phone"],
      });
      returningPatients = prior.length;
    }

    const activePatientPhones = new Set(appointmentsInRange.map((a) => a.phone.trim()));

    let byAgeGroup: { group: string; count: number }[] = [];
    let byGender: { gender: string; count: number }[] = [];
    if (access.patientsDetail) {
      const patients = await prisma.patient.findMany({
        select: { dateOfBirth: true, gender: true },
      });
      const ageMap = new Map<string, number>();
      const genderMap = new Map<string, number>();
      for (const p of patients) {
        const ag = ageGroup(p.dateOfBirth, filters.to);
        if (ag) ageMap.set(ag, (ageMap.get(ag) ?? 0) + 1);
        const g = (p.gender?.trim() || "Not specified").slice(0, 40);
        genderMap.set(g, (genderMap.get(g) ?? 0) + 1);
      }
      byAgeGroup = [...ageMap.entries()]
        .map(([group, count]) => ({ group, count }))
        .sort((a, b) => a.group.localeCompare(b.group));
      byGender = [...genderMap.entries()].map(([gender, count]) => ({ gender, count }));
    }

    const branchNameById = new Map(branches.map((b) => [b.id, b.name]));
    const patientsByBranchMap = new Map<string, Set<string>>();
    for (const a of appointmentsInRange) {
      const bid = a.branchId ?? "unassigned";
      if (!patientsByBranchMap.has(bid)) patientsByBranchMap.set(bid, new Set());
      patientsByBranchMap.get(bid)!.add(a.phone.trim());
    }
    const byBranchPatients = [...patientsByBranchMap.entries()].map(([id, set]) => ({
      branch: id === "unassigned" ? "Unassigned" : (branchNameById.get(id) ?? id),
      count: set.size,
    }));

    const growthMonths = eachMonthOfInterval({
      start: startOfMonth(filters.from),
      end: filters.to,
    });
    const newPatientsByMonth = await Promise.all(
      growthMonths.map(async (m) => {
        const end = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59);
        const count = await prisma.patient.count({
          where: {
            createdAt: {
              gte: m,
              lte: end > filters.to ? filters.to : end,
            },
          },
        });
        return { label: format(m, "MMM yyyy"), count };
      }),
    );

    const newVsReturningTrend = growthMonths.map((m) => {
      const label = format(m, "MMM yyyy");
      const monthStart = m;
      const monthEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59);
      const inMonth = appointmentsInRange.filter(
        (a) => a.appointmentDate >= monthStart && a.appointmentDate <= monthEnd,
      );
      const phones = new Set(inMonth.map((a) => a.phone.trim()));
      return { label, new: 0, returning: phones.size };
    });

    const completedByTreatment = await prisma.appointment.groupBy({
      by: ["treatmentName"],
      _count: true,
      where: { ...apptWhere, status: "COMPLETED" },
    });
    const completedMap = new Map(completedByTreatment.map((c) => [c.treatmentName, c._count]));

    const topServices = serviceGroups.map((s) => ({
      name: s.treatmentName,
      appointments: s._count,
      completed: completedMap.get(s.treatmentName) ?? 0,
    }));

    const serviceMonthMap = new Map<string, number>();
    for (const a of appointmentsInRange) {
      const key = format(a.appointmentDate, "MMM yyyy");
      serviceMonthMap.set(key, (serviceMonthMap.get(key) ?? 0) + 1);
    }
    const monthlyTrend = [...serviceMonthMap.entries()].map(([label, count]) => ({
      label,
      count,
    }));

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

    const doctorRows = await Promise.all(
      doctors
        .filter((d) => !filters.doctorId || d.id === filters.doctorId)
        .map(async (doc) => {
          const docWhere: Prisma.AppointmentWhereInput = {
            ...apptWhere,
            doctorId: doc.id,
          };
          const [total, comp, canc, ns, svcGroups, patientPhones] = await Promise.all([
            prisma.appointment.count({ where: docWhere }),
            prisma.appointment.count({ where: { ...docWhere, status: "COMPLETED" } }),
            prisma.appointment.count({ where: { ...docWhere, status: "CANCELLED" } }),
            prisma.appointment.count({ where: { ...docWhere, status: "NO_SHOW" } }),
            prisma.appointment.groupBy({
              by: ["serviceId"],
              _count: true,
              where: docWhere,
            }),
            prisma.appointment.findMany({
              where: docWhere,
              select: { phone: true },
              distinct: ["phone"],
            }),
          ]);
          const rate = total > 0 ? Math.round((comp / total) * 100) : 0;
          return {
            id: doc.id,
            name: doc.name,
            total,
            completed: comp,
            cancelled: canc,
            noShow: ns,
            completionRate: rate,
            servicesHandled: svcGroups.filter((g) => g.serviceId).length,
            patientCount: patientPhones.length,
          };
        }),
    );

    const branchRows = await Promise.all(
      branches
        .filter((b) => !filters.branchId || b.id === filters.branchId)
        .map(async (branch) => {
          const bw: Prisma.AppointmentWhereInput = {
            appointmentDate: { gte: filters.from, lte: filters.to },
            branchId: branch.id,
            ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
            ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
            ...(filters.appointmentStatus ? { status: filters.appointmentStatus } : {}),
          };
          const [appointments, completedB, cancelledB, topSvc, doctorAppts, branchPatients] =
            await Promise.all([
              prisma.appointment.count({ where: bw }),
              prisma.appointment.count({ where: { ...bw, status: "COMPLETED" } }),
              prisma.appointment.count({ where: { ...bw, status: "CANCELLED" } }),
              prisma.appointment.groupBy({
                by: ["treatmentName"],
                _count: true,
                where: bw,
                orderBy: { _count: { treatmentName: "desc" } },
                take: 1,
              }),
              prisma.appointment.count({
                where: { ...bw, doctorId: { not: null } },
              }),
              prisma.appointment.findMany({
                where: bw,
                select: { phone: true },
                distinct: ["phone"],
              }),
            ]);

          const branchLeads = await prisma.lead.count({
            where: {
              createdAt: { gte: filters.from, lte: filters.to },
              ...(filters.leadSource ? { source: filters.leadSource } : {}),
            },
          });

          return {
            id: branch.id,
            name: branch.name,
            appointments,
            patients: branchPatients.length,
            newLeads: branchLeads,
            completed: completedB,
            cancelled: cancelledB,
            topService: topSvc[0]?.treatmentName ?? null,
            doctorAppointments: doctorAppts,
          };
        }),
    );

    const phoneApptCount = new Map<string, number>();
    for (const a of appointmentsInRange) {
      const p = a.phone.trim();
      phoneApptCount.set(p, (phoneApptCount.get(p) ?? 0) + 1);
    }
    const multiApptPhones = [...phoneApptCount.values()].filter((c) => c >= 2).length;
    const repeatAppointmentRate =
      phoneApptCount.size > 0
        ? Math.round((multiApptPhones / phoneApptCount.size) * 100)
        : 0;

    const followUpAppointments = appointmentsInRange.filter((a) =>
      /follow\s*-?\s*up/i.test(a.treatmentName),
    ).length;

    const patientsNeedingFollowUp = await prisma.appointment.count({
      where: {
        ...apptWhere,
        status: { in: ["COMPLETED", "CONFIRMED"] },
        OR: [
          { notes: { contains: "follow", mode: "insensitive" } },
          { treatmentName: { contains: "follow", mode: "insensitive" } },
        ],
      },
    });

    const retentionMonths = eachMonthOfInterval({
      start: startOfMonth(filters.from),
      end: filters.to,
    });
    const retentionTrend = retentionMonths.map((m) => {
      const monthEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59);
      const inMonth = appointmentsInRange.filter(
        (a) => a.appointmentDate >= m && a.appointmentDate <= monthEnd,
      );
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

    let revenue: ReportsPayload["revenue"] = null;
    let summaryRevenue: string | null = null;

    if (revenueEnabled && completedWithService.length > 0) {
      const priceOf = (a: (typeof completedWithService)[number]) => {
        const p = a.service?.price;
        return p != null ? Number(p) : 0;
      };

      const totalEstimated = completedWithService.reduce((s, a) => s + priceOf(a), 0);
      summaryRevenue = totalEstimated.toFixed(2);

      const bySvc = new Map<string, number>();
      const byBr = new Map<string, number>();
      const byDoc = new Map<string, number>();
      const trendRev = new Map<string, number>();

      for (const a of completedWithService) {
        const amt = priceOf(a);
        if (amt <= 0) continue;
        const svcName = a.service?.name ?? a.treatmentName;
        bySvc.set(svcName, (bySvc.get(svcName) ?? 0) + amt);
        const br = a.branchId
          ? (branchNameById.get(a.branchId) ?? "Unassigned")
          : "Unassigned";
        byBr.set(br, (byBr.get(br) ?? 0) + amt);
        const doc = doctors.find((d) => d.id === a.doctorId)?.name ?? "Unassigned";
        byDoc.set(doc, (byDoc.get(doc) ?? 0) + amt);
        const tl = format(a.appointmentDate, useWeeklyTrend ? "MMM yyyy" : "MMM d");
        trendRev.set(tl, (trendRev.get(tl) ?? 0) + amt);
      }

      revenue = {
        totalEstimated: totalEstimated.toFixed(2),
        byService: [...bySvc.entries()]
          .map(([name, amount]) => ({ name, amount: amount.toFixed(2) }))
          .sort((a, b) => Number(b.amount) - Number(a.amount)),
        byBranch: [...byBr.entries()].map(([branch, amount]) => ({
          branch,
          amount: amount.toFixed(2),
        })),
        byDoctor: [...byDoc.entries()].map(([doctor, amount]) => ({
          doctor,
          amount: amount.toFixed(2),
        })),
        trend: [...trendRev.entries()].map(([label, amount]) => ({ label, amount })),
      };
    } else if (revenueEnabled && settings?.monthlyRevenue != null) {
      summaryRevenue = String(settings.monthlyRevenue);
    }

    return {
      generatedAt: new Date().toISOString(),
      clinicName,
      filters: {
        preset: filters.preset,
        from: filters.from.toISOString(),
        to: filters.to.toISOString(),
        branchId: filters.branchId ?? null,
        doctorId: filters.doctorId ?? null,
        serviceId: filters.serviceId ?? null,
        appointmentStatus: filters.appointmentStatus ?? null,
        leadSource: filters.leadSource ?? null,
      },
      access,
      revenueEnabled,
      summary: {
        totalAppointments: totalAppt,
        totalPatients: totalPatientsCount,
        newLeads: leadStatusCount("NEW"),
        completedAppointments: completed,
        conversionRate,
        revenue: summaryRevenue,
      },
      appointments: {
        total: totalAppt,
        pending,
        confirmed,
        completed,
        cancelled,
        noShow,
        completionRate,
        trend,
        statusDistribution: statusGroups.map((g) => ({
          status: g.status,
          count: g._count,
        })),
        peakHours,
        byDayOfWeek,
      },
      patients: {
        total: totalPatientsCount,
        newInRange: newPatientsCount,
        returning: returningPatients,
        activeInRange: activePatientPhones.size,
        byBranch: byBranchPatients,
        byAgeGroup,
        byGender,
        growthTrend: newPatientsByMonth,
        newVsReturningTrend,
      },
      leads: {
        total: leadsTotal,
        new: leadStatusCount("NEW"),
        contacted: leadStatusCount("CONTACTED"),
        followUp: leadStatusCount("FOLLOW_UP"),
        converted: convertedLeads,
        lost: leadStatusCount("LOST"),
        bySource,
        enquiriesInRange: enquiriesCount,
      },
      services: {
        topServices,
        monthlyTrend,
        byBranch: byBranchService,
      },
      doctors: { rows: doctorRows.filter((d) => d.total > 0 || !filters.doctorId) },
      branches: { rows: branchRows },
      revenue,
      retention: {
        newPatients: newPatientsCount,
        returningPatients: returningPatients,
        repeatAppointmentRate,
        followUpAppointments,
        patientsNeedingFollowUp,
        monthlyTrend: retentionTrend,
      },
    };
  } catch (e) {
    console.error("Reports aggregation error:", e);
    return emptyReportsPayload(defaultClinicName, filters, access, false);
  }
}
