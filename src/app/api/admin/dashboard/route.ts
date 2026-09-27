import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  try {
  const [
    todayAppointments,
    pendingAppointments,
    totalPatients,
    newLeads,
    leadsTotal,
    convertedLeads,
    appointmentsByDay,
    leadFunnel,
    popularServices,
    patientGrowth,
    settings,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { appointmentDate: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELLED" } },
    }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.patient.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "CONVERTED" } }),
    prisma.appointment.groupBy({
      by: ["appointmentDate"],
      _count: true,
      where: { appointmentDate: { gte: subDays(new Date(), 30) } },
      orderBy: { appointmentDate: "asc" },
    }),
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    prisma.appointment.groupBy({
      by: ["treatmentName"],
      _count: true,
      orderBy: { _count: { treatmentName: "desc" } },
      take: 6,
    }),
    prisma.patient.groupBy({
      by: ["createdAt"],
      _count: true,
      where: { createdAt: { gte: subDays(new Date(), 90) } },
    }),
    prisma.clinicSettings.findUnique({ where: { id: "default" } }),
  ]);

  const conversionRate = leadsTotal > 0 ? Math.round((convertedLeads / leadsTotal) * 100) : 0;

  return NextResponse.json({
    cards: {
      todayAppointments,
      pendingAppointments,
      totalPatients,
      newLeads,
      conversionRate,
      monthlyRevenue: settings?.showRevenueCard ? settings.monthlyRevenue : null,
    },
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
    return NextResponse.json({
      cards: {
        todayAppointments: 0,
        pendingAppointments: 0,
        totalPatients: 0,
        newLeads: 0,
        conversionRate: 0,
        monthlyRevenue: null,
      },
      charts: {
        appointmentsByDay: [],
        leadFunnel: [],
        popularServices: [],
        patientGrowth: [],
      },
      dbUnavailable: true,
    });
  }
}
