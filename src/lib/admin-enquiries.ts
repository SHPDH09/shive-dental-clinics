import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type AdminEnquiryListOptions = {
  page: number;
  limit: number;
  q?: string;
  status?: string;
  source?: string;
  assignedStaff?: string;
  important?: boolean;
  dateFrom?: string;
  dateTo?: string;
};

function normalizeStatus(status: string | undefined): string | undefined {
  if (!status) return undefined;
  if (status === "UNREAD") return "NEW";
  if (status === "READ") return "REPLIED";
  return status;
}

export async function listAdminEnquiries(options: AdminEnquiryListOptions) {
  const skip = (options.page - 1) * options.limit;
  const status = normalizeStatus(options.status);

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    let query = sb.from("Enquiry").select("*", { count: "exact" });
    if (status) query = query.eq("status", status);
    if (options.source) query = query.eq("source", options.source);
    if (options.assignedStaff) query = query.eq("assignedStaff", options.assignedStaff);
    if (options.important) query = query.eq("important", true);
    if (options.q) {
      query = query.or(
        `name.ilike.%${options.q}%,phone.ilike.%${options.q}%,email.ilike.%${options.q}%,subject.ilike.%${options.q}%,message.ilike.%${options.q}%`,
      );
    }
    if (options.dateFrom) query = query.gte("createdAt", new Date(options.dateFrom).toISOString());
    if (options.dateTo) {
      const end = new Date(options.dateTo);
      end.setHours(23, 59, 59, 999);
      query = query.lte("createdAt", end.toISOString());
    }
    query = query.order("createdAt", { ascending: false }).range(skip, skip + options.limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { items: data ?? [], total: count ?? 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;
  if (options.source) where.source = options.source;
  if (options.assignedStaff) where.assignedStaff = options.assignedStaff;
  if (options.important) where.important = true;
  if (options.q) {
    where.OR = [
      { name: { contains: options.q, mode: "insensitive" } },
      { phone: { contains: options.q, mode: "insensitive" } },
      { email: { contains: options.q, mode: "insensitive" } },
      { subject: { contains: options.q, mode: "insensitive" } },
      { message: { contains: options.q, mode: "insensitive" } },
    ];
  }
  if (options.dateFrom || options.dateTo) {
    where.createdAt = {};
    if (options.dateFrom) where.createdAt.gte = new Date(options.dateFrom);
    if (options.dateTo) {
      const end = new Date(options.dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [items, total] = await Promise.all([
    prisma.enquiry.findMany({ where, skip, take: options.limit, orderBy: { createdAt: "desc" } }),
    prisma.enquiry.count({ where }),
  ]);
  return { items, total };
}

export async function enquiryStatusCounts() {
  const statuses = ["NEW", "IN_PROGRESS", "REPLIED", "CLOSED"] as const;
  const counts: Record<string, number> = {};

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    for (const s of statuses) {
      const { count } = await sb
        .from("Enquiry")
        .select("*", { count: "exact", head: true })
        .eq("status", s);
      counts[s] = count ?? 0;
    }
    const { count: legacyNew } = await sb
      .from("Enquiry")
      .select("*", { count: "exact", head: true })
      .eq("status", "UNREAD");
    counts.NEW += legacyNew ?? 0;
    return counts;
  }

  for (const s of statuses) {
    counts[s] = await prisma.enquiry.count({ where: { status: s } });
  }
  return counts;
}
