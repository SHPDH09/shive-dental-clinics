import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type LeadDashboardStats = {
  totalLeads: number;
  newLeads: number;
  followUpsToday: number;
  converted: number;
  lost: number;
  conversionRate: number;
  overdueFollowUps: number;
};

export type LeadListRow = {
  id: string;
  leadCode: string;
  name: string;
  phone: string;
  whatsAppNumber: string | null;
  email: string | null;
  age: number | null;
  source: string;
  sourceCustom: string | null;
  interestedService: string | null;
  branchName: string | null;
  doctorName: string | null;
  status: string;
  priority: string;
  assignedStaff: string | null;
  createdAt: string;
  lastContactAt: string | null;
  followUpDate: string | null;
  followUpTime: string | null;
};

export async function getLeadDashboardStats(): Promise<LeadDashboardStats> {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  if (useSupabaseCrud()) {
    try {
      const sb = await getAdminSupabaseClient();
      const [total, newC, converted, lost, todayFu, overdue] = await Promise.all([
        sb.from("Lead").select("*", { count: "exact", head: true }),
        sb.from("Lead").select("*", { count: "exact", head: true }).eq("status", "NEW"),
        sb.from("Lead").select("*", { count: "exact", head: true }).eq("status", "CONVERTED"),
        sb.from("Lead").select("*", { count: "exact", head: true }).eq("status", "LOST"),
        sb
          .from("Lead")
          .select("*", { count: "exact", head: true })
          .gte("followUpDate", todayStart.toISOString())
          .lte("followUpDate", todayEnd.toISOString()),
        sb
          .from("Lead")
          .select("*", { count: "exact", head: true })
          .lt("followUpDate", todayStart.toISOString())
          .neq("status", "CONVERTED")
          .neq("status", "LOST"),
      ]);
      const totalLeads = total.count ?? 0;
      const convertedCount = converted.count ?? 0;
      return {
        totalLeads,
        newLeads: newC.count ?? 0,
        followUpsToday: todayFu.count ?? 0,
        converted: convertedCount,
        lost: lost.count ?? 0,
        conversionRate: totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 1000) / 10 : 0,
        overdueFollowUps: overdue.count ?? 0,
      };
    } catch {
      return emptyStats();
    }
  }

  const [totalLeads, newLeads, followUpsToday, converted, lost, overdueFollowUps] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.count({
        where: { followUpDate: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.lead.count({ where: { status: "CONVERTED" } }),
      prisma.lead.count({ where: { status: "LOST" } }),
      prisma.lead.count({
        where: {
          followUpDate: { lt: todayStart },
          status: { notIn: ["CONVERTED", "LOST"] },
        },
      }),
    ]);

  return {
    totalLeads,
    newLeads,
    followUpsToday,
    converted,
    lost,
    conversionRate: totalLeads > 0 ? Math.round((converted / totalLeads) * 1000) / 10 : 0,
    overdueFollowUps,
  };
}

function emptyStats(): LeadDashboardStats {
  return {
    totalLeads: 0,
    newLeads: 0,
    followUpsToday: 0,
    converted: 0,
    lost: 0,
    conversionRate: 0,
    overdueFollowUps: 0,
  };
}

export async function listLeadsEnriched(filters: {
  page: number;
  limit: number;
  q?: string;
  status?: string;
  source?: string;
  priority?: string;
  assignedStaff?: string;
}): Promise<{ items: LeadListRow[]; total: number }> {
  const skip = (filters.page - 1) * filters.limit;
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assignedStaff) where.assignedStaff = filters.assignedStaff;
  if (filters.q?.trim()) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { leadCode: { contains: filters.q, mode: "insensitive" } },
      { interestedService: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
      include: {
        preferredBranch: { select: { name: true } },
        preferredDoctor: { select: { name: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    items: rows.map(mapLeadRow),
    total,
  };
}

export function mapLeadRowFromRecord(p: Record<string, unknown>): LeadListRow {
  return {
    id: String(p.id),
    leadCode: String(p.leadCode ?? ""),
    name: String(p.name ?? ""),
    phone: String(p.phone ?? ""),
    whatsAppNumber: (p.whatsAppNumber as string | null) ?? null,
    email: (p.email as string | null) ?? null,
    age: typeof p.age === "number" ? p.age : null,
    source: String(p.source ?? "WEBSITE"),
    sourceCustom: (p.sourceCustom as string | null) ?? null,
    interestedService: (p.interestedService as string | null) ?? null,
    branchName: null,
    doctorName: null,
    status: String(p.status ?? "NEW"),
    priority: String(p.priority ?? "MEDIUM"),
    assignedStaff: (p.assignedStaff as string | null) ?? null,
    createdAt: String(p.createdAt ?? new Date().toISOString()),
    lastContactAt: p.lastContactAt ? String(p.lastContactAt) : null,
    followUpDate: p.followUpDate ? String(p.followUpDate) : null,
    followUpTime: (p.followUpTime as string | null) ?? null,
  };
}

function mapLeadRow(
  p: Awaited<ReturnType<typeof prisma.lead.findMany>>[number] & {
    preferredBranch?: { name: string } | null;
    preferredDoctor?: { name: string } | null;
  },
): LeadListRow {
  return {
    id: p.id,
    leadCode: p.leadCode,
    name: p.name,
    phone: p.phone,
    whatsAppNumber: p.whatsAppNumber,
    email: p.email,
    age: p.age,
    source: p.source,
    sourceCustom: p.sourceCustom,
    interestedService: p.interestedService,
    branchName: p.preferredBranch?.name ?? null,
    doctorName: p.preferredDoctor?.name ?? null,
    status: p.status,
    priority: p.priority,
    assignedStaff: p.assignedStaff,
    createdAt: p.createdAt.toISOString(),
    lastContactAt: p.lastContactAt?.toISOString() ?? null,
    followUpDate: p.followUpDate?.toISOString() ?? null,
    followUpTime: p.followUpTime,
  };
}
