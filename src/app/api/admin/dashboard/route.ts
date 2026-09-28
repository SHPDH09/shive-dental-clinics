import { branchScopeFilter } from "@/lib/admin-context";
import { requireAdminContext } from "@/lib/api-auth";
import { buildDashboardSupabase } from "@/lib/dashboard/build-dashboard-supabase";
import { prisma } from "@/lib/prisma";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";

function emptyDashboard(branchId: string | undefined, dbUnavailable = false) {
  return NextResponse.json({
    branchId: branchId ?? null,
    branchName: null,
    cards: {
      todayAppointments: 0,
      pendingAppointments: 0,
      completedAppointments: 0,
      totalPatients: 0,
      newLeads: 0,
      conversionRate: 0,
      monthlyRevenue: null,
    },
    doctorAvailability: [],
    charts: {
      appointmentsByDay: [],
      leadFunnel: [],
      popularServices: [],
      patientGrowth: [],
    },
    dbUnavailable,
  });
}

export async function GET(req: Request) {
  const { admin, error } = await requireAdminContext();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const branchId =
    searchParams.get("branchId")?.trim() || branchScopeFilter(admin ?? null) || undefined;

  if (useSupabaseCrud()) {
    try {
      const payload = await buildDashboardSupabase(branchId);
      return NextResponse.json(payload);
    } catch (e) {
      console.error("Dashboard Supabase error:", e);
      return emptyDashboard(branchId, true);
    }
  }

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const appointmentWhere = branchId ? { branchId } : {};
  const todayWhere = {
    ...appointmentWhere,
    appointmentDate: { gte: todayStart, lte: todayEnd },
    status: { not: "CANCELLED" as const },
  };

  try {
    const [
      todayAppointments,
      pendingAppointments,
      completedAppointments,
      totalPatientsAtBranch,
      newLeads,
      leadsTotal,
      convertedLeads,
      appointmentsByDay,
      leadFunnel,
      popularServices,
      patientGrowth,
      settings,
      branchRow,
      branchDoctors,
    ] = await Promise.all([
      prisma.appointment.count({ where: todayWhere }),
      prisma.appointment.count({ where: { ...appointmentWhere, status: "PENDING" } }),
      prisma.appointment.count({ where: { ...appointmentWhere, status: "COMPLETED" } }),
      branchId
        ? prisma.appointment.findMany({
            where: { branchId },
            select: { phone: true },
            distinct: ["phone"],
          })
        : Promise.resolve(null),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "CONVERTED" } }),
      prisma.appointment.groupBy({
        by: ["appointmentDate"],
        _count: true,
        where: { ...appointmentWhere, appointmentDate: { gte: subDays(new Date(), 30) } },
        orderBy: { appointmentDate: "asc" },
      }),
      prisma.lead.groupBy({ by: ["status"], _count: true }),
      prisma.appointment.groupBy({
        by: ["treatmentName"],
        _count: true,
        where: appointmentWhere,
        orderBy: { _count: { treatmentName: "desc" } },
        take: 6,
      }),
      prisma.patient.groupBy({
        by: ["createdAt"],
        _count: true,
        where: { createdAt: { gte: subDays(new Date(), 90) } },
      }),
      prisma.clinicSettings.findUnique({ where: { id: "default" } }),
      branchId ? prisma.branch.findUnique({ where: { id: branchId } }) : Promise.resolve(null),
      branchId
        ? prisma.doctor.findMany({
            where: { enabled: true },
            select: { id: true, name: true, consultationHours: true },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

    void monthStart;
    void monthEnd;

    const totalPatients =
      branchId && totalPatientsAtBranch
        ? totalPatientsAtBranch.length
        : await prisma.patient.count();

    const conversionRate = leadsTotal > 0 ? Math.round((convertedLeads / leadsTotal) * 100) : 0;

    let doctorAvailability: { name: string; hours: string | null }[] = [];
    if (branchRow && branchDoctors.length > 0) {
      const ids = Array.isArray(branchRow.doctorIds) ? (branchRow.doctorIds as string[]) : [];
      doctorAvailability = branchDoctors
        .filter((d) => ids.length === 0 || ids.includes(d.id))
        .map((d) => ({ name: d.name, hours: d.consultationHours }));
    }

    return NextResponse.json({
      branchId: branchId ?? null,
      branchName: branchRow?.name ?? null,
      cards: {
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        totalPatients,
        newLeads,
        conversionRate,
        monthlyRevenue: settings?.showRevenueCard ? settings.monthlyRevenue : null,
      },
      doctorAvailability,
      charts: {
        appointmentsByDay: appointmentsByDay.map((a) => ({
          date: a.appointmentDate.toISOString().slice(0, 10),
          count: a._count,
        })),
        leadFunnel: leadFunnel.map((l) => ({ status: l.status, count: l._count })),
        popularServices: popularServices.map((s) => ({
          name: s.treatmentName,
          count: s._count,
        })),
        patientGrowth: patientGrowth.map((p) => ({
          date: p.createdAt.toISOString().slice(0, 10),
          count: p._count,
        })),
      },
    });
  } catch (e) {
    console.error("Dashboard DB error:", e);
    return emptyDashboard(branchId, true);
  }
}
