import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type InboxRow = {
  id: string;
  patientName: string;
  patientCode: string | null;
  phone: string | null;
  email: string | null;
  channel: string;
  lastMessage: string;
  lastAt: string;
  assignedStaff: string | null;
  unreadCount: number;
  status: string;
  patientId: string | null;
  leadId: string | null;
  enquiryId: string | null;
};

export async function buildUnifiedInbox(limit = 50): Promise<InboxRow[]> {
  const map = new Map<string, InboxRow>();

  const push = (key: string, row: Partial<InboxRow> & { lastAt: string; lastMessage: string }) => {
    const existing = map.get(key);
    if (!existing || new Date(row.lastAt) > new Date(existing.lastAt)) {
      map.set(key, {
        id: row.id ?? key,
        patientName: row.patientName ?? "Unknown",
        patientCode: row.patientCode ?? null,
        phone: row.phone ?? null,
        email: row.email ?? null,
        channel: row.channel ?? "EMAIL",
        lastMessage: row.lastMessage,
        lastAt: row.lastAt,
        assignedStaff: row.assignedStaff ?? null,
        unreadCount: row.unreadCount ?? 0,
        status: row.status ?? "OPEN",
        patientId: row.patientId ?? null,
        leadId: row.leadId ?? null,
        enquiryId: row.enquiryId ?? null,
      });
    }
  };

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data: logs } = await sb
      .from("CommunicationLog")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(200);
    for (const l of logs ?? []) {
      const key = String(l.patientId ?? l.leadId ?? l.enquiryId ?? l.recipientPhone ?? l.id);
      push(key, {
        id: String(l.id),
        patientName: String(l.recipientName ?? "Contact"),
        phone: l.recipientPhone ? String(l.recipientPhone) : null,
        email: l.recipientEmail ? String(l.recipientEmail) : null,
        channel: String(l.channel),
        lastMessage: String(l.body).slice(0, 120),
        lastAt: String(l.createdAt),
        patientId: l.patientId ? String(l.patientId) : null,
        leadId: l.leadId ? String(l.leadId) : null,
        enquiryId: l.enquiryId ? String(l.enquiryId) : null,
        status: String(l.status),
      });
    }

    const { data: enquiries } = await sb
      .from("Enquiry")
      .select("*")
      .order("updatedAt", { ascending: false })
      .limit(80);
    for (const e of enquiries ?? []) {
      const key = `enq-${e.id}`;
      push(key, {
        id: String(e.id),
        patientName: String(e.name),
        phone: String(e.phone),
        email: e.email ? String(e.email) : null,
        channel: String(e.source) === "WHATSAPP" ? "WHATSAPP" : "EMAIL",
        lastMessage: String(e.message).slice(0, 120),
        lastAt: String(e.updatedAt ?? e.createdAt),
        assignedStaff: e.assignedStaff ? String(e.assignedStaff) : null,
        enquiryId: String(e.id),
        patientId: e.patientId ? String(e.patientId) : null,
        status: String(e.status),
        unreadCount: e.status === "NEW" ? 1 : 0,
      });
    }
  } else {
    try {
      const logs = await prisma.communicationLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      for (const l of logs) {
        const key = l.patientId ?? l.leadId ?? l.enquiryId ?? l.recipientPhone ?? l.id;
        push(key, {
          id: l.id,
          patientName: l.recipientName ?? "Contact",
          phone: l.recipientPhone,
          email: l.recipientEmail,
          channel: l.channel,
          lastMessage: l.body.slice(0, 120),
          lastAt: l.createdAt.toISOString(),
          patientId: l.patientId,
          leadId: l.leadId,
          enquiryId: l.enquiryId,
          status: l.status,
        });
      }
      const enquiries = await prisma.enquiry.findMany({
        orderBy: { updatedAt: "desc" },
        take: 80,
      });
      for (const e of enquiries) {
        push(`enq-${e.id}`, {
          id: e.id,
          patientName: e.name,
          phone: e.phone,
          email: e.email,
          channel: e.source === "WHATSAPP" ? "WHATSAPP" : "EMAIL",
          lastMessage: e.message.slice(0, 120),
          lastAt: e.updatedAt.toISOString(),
          assignedStaff: e.assignedStaff,
          enquiryId: e.id,
          patientId: e.patientId,
          status: e.status,
          unreadCount: e.status === "NEW" ? 1 : 0,
        });
      }
    } catch {
      /* tables may be missing locally */
    }
  }

  return [...map.values()]
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
    .slice(0, limit);
}
