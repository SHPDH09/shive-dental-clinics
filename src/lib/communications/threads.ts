import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import type { CommunicationChannel } from "@/generated/prisma/client";

export type ThreadFilters = {
  q?: string;
  channel?: string;
  status?: string;
  branchId?: string;
  assignedAdminId?: string;
  important?: boolean;
  unreadOnly?: boolean;
  limit?: number;
};

export type ThreadListRow = {
  id: string;
  channel: string;
  status: string;
  contactName: string;
  patientCode: string | null;
  phone: string | null;
  email: string | null;
  branchName: string | null;
  lastMessage: string;
  lastAt: string;
  assignedStaff: string | null;
  unreadCount: number;
  important: boolean;
  patientId: string | null;
  leadId: string | null;
  enquiryId: string | null;
};

export type ThreadDetail = ThreadListRow & {
  messages: {
    id: string;
    direction: string;
    body: string;
    senderLabel: string | null;
    createdAt: string;
    readAt: string | null;
  }[];
};

function threadKey(input: {
  channel: string;
  patientId?: string | null;
  leadId?: string | null;
  enquiryId?: string | null;
  phone?: string | null;
  email?: string | null;
}): string {
  if (input.patientId) return `p:${input.patientId}:${input.channel}`;
  if (input.leadId) return `l:${input.leadId}:${input.channel}`;
  if (input.enquiryId) return `e:${input.enquiryId}:${input.channel}`;
  if (input.phone) return `ph:${input.phone}:${input.channel}`;
  if (input.email) return `em:${input.email}:${input.channel}`;
  return `misc:${createId()}`;
}

export async function syncThreadsFromLegacy(): Promise<void> {
  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data: existing } = await sb.from("CommunicationThread").select("id").limit(1);
    if (existing && existing.length > 0) return;

    const { data: logs } = await sb
      .from("CommunicationLog")
      .select("*")
      .order("createdAt", { ascending: true })
      .limit(500);
    const threadIds = new Map<string, string>();

    for (const l of logs ?? []) {
      const channel = String(l.channel);
      const key = threadKey({
        channel,
        patientId: l.patientId ? String(l.patientId) : null,
        leadId: l.leadId ? String(l.leadId) : null,
        enquiryId: l.enquiryId ? String(l.enquiryId) : null,
        phone: l.recipientPhone ? String(l.recipientPhone) : null,
        email: l.recipientEmail ? String(l.recipientEmail) : null,
      });
      let threadId = threadIds.get(key);
      if (!threadId) {
        threadId = createId();
        threadIds.set(key, threadId);
        await sb.from("CommunicationThread").insert({
          id: threadId,
          channel,
          status: "OPEN",
          contactName: String(l.recipientName ?? "Contact"),
          contactPhone: l.recipientPhone ?? null,
          contactEmail: l.recipientEmail ?? null,
          patientId: l.patientId ?? null,
          leadId: l.leadId ?? null,
          enquiryId: l.enquiryId ?? null,
          unreadCount: l.direction === "INBOUND" ? 1 : 0,
          lastMessage: String(l.body).slice(0, 200),
          lastMessageAt: l.createdAt,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt ?? l.createdAt,
        });
      } else {
        await sb
          .from("CommunicationThread")
          .update({
            lastMessage: String(l.body).slice(0, 200),
            lastMessageAt: l.createdAt,
            updatedAt: l.updatedAt ?? l.createdAt,
          })
          .eq("id", threadId);
      }
      const msgId = createId();
      await sb.from("CommunicationThreadMessage").insert({
        id: msgId,
        threadId,
        direction: l.direction ?? "OUTBOUND",
        channel,
        body: String(l.body),
        senderLabel: l.direction === "INBOUND" ? String(l.recipientName ?? "Patient") : "Staff",
        sentByAdminId: l.sentByAdminId ?? null,
        communicationLogId: l.id,
        createdAt: l.createdAt,
      });
    }

    const { data: enquiries } = await sb.from("Enquiry").select("*").order("updatedAt", { ascending: false }).limit(80);
    for (const e of enquiries ?? []) {
      const channel = String(e.source) === "WHATSAPP" ? "WHATSAPP" : "EMAIL";
      const key = threadKey({ channel, enquiryId: String(e.id), phone: String(e.phone) });
      if (threadIds.has(key)) continue;
      const threadId = createId();
      threadIds.set(key, threadId);
      const now = String(e.updatedAt ?? e.createdAt);
      await sb.from("CommunicationThread").insert({
        id: threadId,
        channel,
        status: e.status === "CLOSED" ? "CLOSED" : "OPEN",
        contactName: String(e.name),
        contactPhone: String(e.phone),
        contactEmail: e.email ?? null,
        patientId: e.patientId ?? null,
        enquiryId: String(e.id),
        assignedStaffName: e.assignedStaff ?? null,
        unreadCount: e.status === "NEW" ? 1 : 0,
        important: Boolean(e.important),
        lastMessage: String(e.message).slice(0, 200),
        lastMessageAt: now,
        createdAt: e.createdAt,
        updatedAt: now,
      });
      await sb.from("CommunicationThreadMessage").insert({
        id: createId(),
        threadId,
        direction: "INBOUND",
        channel,
        body: String(e.message),
        senderLabel: String(e.name),
        createdAt: e.createdAt,
      });
      const conv = Array.isArray(e.conversation) ? e.conversation : [];
      for (const c of conv as { message?: string; sentBy?: string; at?: string }[]) {
        if (!c?.message) continue;
        await sb.from("CommunicationThreadMessage").insert({
          id: createId(),
          threadId,
          direction: c.sentBy === "staff" ? "OUTBOUND" : "INBOUND",
          channel,
          body: String(c.message),
          senderLabel: c.sentBy === "staff" ? "Staff" : String(e.name),
          createdAt: c.at ?? now,
        });
      }
    }
    return;
  }

  try {
    const count = await prisma.communicationThread.count();
    if (count > 0) return;
  } catch {
    return;
  }

  const logs = await prisma.communicationLog.findMany({ orderBy: { createdAt: "asc" }, take: 500 });
  const threadIds = new Map<string, string>();
  for (const l of logs) {
    const key = threadKey({
      channel: l.channel,
      patientId: l.patientId,
      leadId: l.leadId,
      enquiryId: l.enquiryId,
      phone: l.recipientPhone,
      email: l.recipientEmail,
    });
    let threadId = threadIds.get(key);
    if (!threadId) {
      const t = await prisma.communicationThread.create({
        data: {
          channel: l.channel,
          contactName: l.recipientName ?? "Contact",
          contactPhone: l.recipientPhone,
          contactEmail: l.recipientEmail,
          patientId: l.patientId,
          leadId: l.leadId,
          enquiryId: l.enquiryId,
          unreadCount: l.direction === "INBOUND" ? 1 : 0,
          lastMessage: l.body.slice(0, 200),
          lastMessageAt: l.createdAt,
        },
      });
      threadId = t.id;
      threadIds.set(key, threadId);
    } else {
      await prisma.communicationThread.update({
        where: { id: threadId },
        data: { lastMessage: l.body.slice(0, 200), lastMessageAt: l.createdAt },
      });
    }
    await prisma.communicationThreadMessage.create({
      data: {
        threadId,
        direction: l.direction,
        channel: l.channel,
        body: l.body,
        senderLabel: l.direction === "INBOUND" ? l.recipientName ?? "Patient" : "Staff",
        sentByAdminId: l.sentByAdminId,
        communicationLogId: l.id,
        createdAt: l.createdAt,
      },
    });
  }
}

async function enrichThreadRow(row: Record<string, unknown>): Promise<ThreadListRow> {
  let patientCode: string | null = null;
  let branchName: string | null = null;
  const patientId = row.patientId ? String(row.patientId) : null;

  if (patientId) {
    if (useSupabaseCrud()) {
      const sb = await getAdminSupabaseClient();
      const { data: p } = await sb
        .from("Patient")
        .select("patientCode, preferredBranchId")
        .eq("id", patientId)
        .maybeSingle();
      if (p) {
        patientCode = p.patientCode ? String(p.patientCode) : null;
        if (p.preferredBranchId) {
          const { data: b } = await sb.from("Branch").select("name").eq("id", String(p.preferredBranchId)).maybeSingle();
          branchName = b?.name ? String(b.name) : null;
        }
      }
    } else {
      const p = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { patientCode: true, preferredBranch: { select: { name: true } } },
      });
      patientCode = p?.patientCode ?? null;
      branchName = p?.preferredBranch?.name ?? null;
    }
  }

  return {
    id: String(row.id),
    channel: String(row.channel),
    status: String(row.status ?? "OPEN"),
    contactName: String(row.contactName),
    patientCode,
    phone: row.contactPhone ? String(row.contactPhone) : null,
    email: row.contactEmail ? String(row.contactEmail) : null,
    branchName,
    lastMessage: String(row.lastMessage ?? ""),
    lastAt: String(row.lastMessageAt ?? row.updatedAt ?? row.createdAt),
    assignedStaff: row.assignedStaffName ? String(row.assignedStaffName) : null,
    unreadCount: Number(row.unreadCount ?? 0),
    important: Boolean(row.important),
    patientId,
    leadId: row.leadId ? String(row.leadId) : null,
    enquiryId: row.enquiryId ? String(row.enquiryId) : null,
  };
}

export async function listThreads(filters: ThreadFilters = {}): Promise<ThreadListRow[]> {
  await syncThreadsFromLegacy().catch(() => undefined);
  const limit = Math.min(filters.limit ?? 50, 100);

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    let q = sb.from("CommunicationThread").select("*").order("lastMessageAt", { ascending: false }).limit(limit);
    if (filters.channel) q = q.eq("channel", filters.channel);
    if (filters.status) q = q.eq("status", filters.status);
    if (filters.branchId) q = q.eq("branchId", filters.branchId);
    if (filters.assignedAdminId) q = q.eq("assignedAdminId", filters.assignedAdminId);
    if (filters.important) q = q.eq("important", true);
    if (filters.unreadOnly) q = q.gt("unreadCount", 0);
    const { data, error } = await q;
    if (error) return [];
    let rows = data ?? [];
    if (filters.q) {
      const lower = filters.q.toLowerCase();
      rows = rows.filter(
        (r) =>
          String(r.contactName).toLowerCase().includes(lower) ||
          String(r.lastMessage ?? "").toLowerCase().includes(lower) ||
          String(r.contactPhone ?? "").includes(lower),
      );
    }
    const out: ThreadListRow[] = [];
    for (const r of rows) out.push(await enrichThreadRow(r));
    return out;
  }

  try {
    const rows = await prisma.communicationThread.findMany({
      where: {
        ...(filters.channel ? { channel: filters.channel as CommunicationChannel } : {}),
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        ...(filters.assignedAdminId ? { assignedAdminId: filters.assignedAdminId } : {}),
        ...(filters.important ? { important: true } : {}),
        ...(filters.unreadOnly ? { unreadCount: { gt: 0 } } : {}),
        ...(filters.q
          ? {
              OR: [
                { contactName: { contains: filters.q, mode: "insensitive" } },
                { lastMessage: { contains: filters.q, mode: "insensitive" } },
                { contactPhone: { contains: filters.q } },
              ],
            }
          : {}),
      },
      orderBy: { lastMessageAt: "desc" },
      take: limit,
    });
    return Promise.all(rows.map((r) => enrichThreadRow(r as unknown as Record<string, unknown>)));
  } catch {
    return [];
  }
}

export async function getThreadDetail(threadId: string): Promise<ThreadDetail | null> {
  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data: row } = await sb.from("CommunicationThread").select("*").eq("id", threadId).maybeSingle();
    if (!row) return null;
    const { data: messages } = await sb
      .from("CommunicationThreadMessage")
      .select("*")
      .eq("threadId", threadId)
      .order("createdAt", { ascending: true });
    const base = await enrichThreadRow(row);
    return {
      ...base,
      messages: (messages ?? []).map((m) => ({
        id: String(m.id),
        direction: String(m.direction),
        body: String(m.body),
        senderLabel: m.senderLabel ? String(m.senderLabel) : null,
        createdAt: String(m.createdAt),
        readAt: m.readAt ? String(m.readAt) : null,
      })),
    };
  }

  try {
    const row = await prisma.communicationThread.findUnique({
      where: { id: threadId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!row) return null;
    const base = await enrichThreadRow(row as unknown as Record<string, unknown>);
    return {
      ...base,
      messages: row.messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        body: m.body,
        senderLabel: m.senderLabel,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt?.toISOString() ?? null,
      })),
    };
  } catch {
    return null;
  }
}

export type AppendThreadMessageInput = {
  channel: CommunicationChannel;
  direction: "INBOUND" | "OUTBOUND";
  contactName: string;
  body: string;
  phone?: string | null;
  email?: string | null;
  patientId?: string | null;
  leadId?: string | null;
  enquiryId?: string | null;
  branchId?: string | null;
  sentByAdminId?: string | null;
  sentByStaffName?: string | null;
  communicationLogId?: string | null;
  senderLabel?: string;
};

export async function appendThreadMessage(input: AppendThreadMessageInput): Promise<string | null> {
  const now = new Date();
  const key = threadKey({
    channel: input.channel,
    patientId: input.patientId,
    leadId: input.leadId,
    enquiryId: input.enquiryId,
    phone: input.phone,
    email: input.email,
  });

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    let threadId: string | null = null;
    const findExisting = async (col: string, val: string) => {
      const { data } = await sb
        .from("CommunicationThread")
        .select("id")
        .eq("channel", input.channel)
        .eq(col, val)
        .limit(1);
      const row = data?.[0];
      return row?.id ? String(row.id) : null;
    };
    if (input.patientId) threadId = await findExisting("patientId", input.patientId);
    if (!threadId && input.leadId) threadId = await findExisting("leadId", input.leadId);
    if (!threadId && input.enquiryId) threadId = await findExisting("enquiryId", input.enquiryId);
    if (!threadId && input.phone) threadId = await findExisting("contactPhone", input.phone);
    if (!threadId) {
      threadId = createId();
      await sb.from("CommunicationThread").insert({
        id: threadId,
        channel: input.channel,
        status: "OPEN",
        contactName: input.contactName,
        contactPhone: input.phone ?? null,
        contactEmail: input.email ?? null,
        patientId: input.patientId ?? null,
        leadId: input.leadId ?? null,
        enquiryId: input.enquiryId ?? null,
        branchId: input.branchId ?? null,
        unreadCount: input.direction === "INBOUND" ? 1 : 0,
        lastMessage: input.body.slice(0, 200),
        lastMessageAt: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    } else {
      const { data: t } = await sb.from("CommunicationThread").select("unreadCount").eq("id", threadId).maybeSingle();
      await sb
        .from("CommunicationThread")
        .update({
          lastMessage: input.body.slice(0, 200),
          lastMessageAt: now.toISOString(),
          updatedAt: now.toISOString(),
          unreadCount:
            input.direction === "INBOUND" ? Number(t?.unreadCount ?? 0) + 1 : Number(t?.unreadCount ?? 0),
          contactName: input.contactName,
        })
        .eq("id", threadId);
    }
    const msgId = createId();
    await sb.from("CommunicationThreadMessage").insert({
      id: msgId,
      threadId,
      direction: input.direction,
      channel: input.channel,
      body: input.body,
      senderLabel: input.senderLabel ?? (input.direction === "OUTBOUND" ? input.sentByStaffName ?? "Staff" : input.contactName),
      sentByAdminId: input.sentByAdminId ?? null,
      communicationLogId: input.communicationLogId ?? null,
      createdAt: now.toISOString(),
    });
    void key;
    return threadId;
  }

  try {
    let thread = await prisma.communicationThread.findFirst({
      where: {
        channel: input.channel,
        OR: [
          ...(input.patientId ? [{ patientId: input.patientId }] : []),
          ...(input.leadId ? [{ leadId: input.leadId }] : []),
          ...(input.enquiryId ? [{ enquiryId: input.enquiryId }] : []),
          ...(input.phone ? [{ contactPhone: input.phone }] : []),
        ],
      },
    });
    if (!thread) {
      thread = await prisma.communicationThread.create({
        data: {
          channel: input.channel,
          contactName: input.contactName,
          contactPhone: input.phone,
          contactEmail: input.email,
          patientId: input.patientId,
          leadId: input.leadId,
          enquiryId: input.enquiryId,
          branchId: input.branchId,
          unreadCount: input.direction === "INBOUND" ? 1 : 0,
          lastMessage: input.body.slice(0, 200),
          lastMessageAt: now,
        },
      });
    } else {
      thread = await prisma.communicationThread.update({
        where: { id: thread.id },
        data: {
          lastMessage: input.body.slice(0, 200),
          lastMessageAt: now,
          unreadCount: input.direction === "INBOUND" ? thread.unreadCount + 1 : thread.unreadCount,
          contactName: input.contactName,
        },
      });
    }
    await prisma.communicationThreadMessage.create({
      data: {
        threadId: thread.id,
        direction: input.direction,
        channel: input.channel,
        body: input.body,
        senderLabel:
          input.senderLabel ??
          (input.direction === "OUTBOUND" ? input.sentByStaffName ?? "Staff" : input.contactName),
        sentByAdminId: input.sentByAdminId,
        communicationLogId: input.communicationLogId,
      },
    });
    return thread.id;
  } catch {
    return null;
  }
}

export async function patchThread(
  threadId: string,
  patch: {
    status?: string;
    unreadCount?: number;
    important?: boolean;
    assignedAdminId?: string | null;
    assignedStaffName?: string | null;
    markRead?: boolean;
    markUnread?: boolean;
  },
): Promise<boolean> {
  const now = new Date();
  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const updates: Record<string, unknown> = { updatedAt: now.toISOString() };
    if (patch.status) updates.status = patch.status;
    if (patch.important !== undefined) updates.important = patch.important;
    if (patch.assignedAdminId !== undefined) updates.assignedAdminId = patch.assignedAdminId;
    if (patch.assignedStaffName !== undefined) updates.assignedStaffName = patch.assignedStaffName;
    if (patch.markRead) updates.unreadCount = 0;
    if (patch.markUnread) updates.unreadCount = 1;
    if (patch.unreadCount !== undefined) updates.unreadCount = patch.unreadCount;
    const { error } = await sb.from("CommunicationThread").update(updates).eq("id", threadId);
    if (error) return false;
    if (patch.markRead) {
      await sb
        .from("CommunicationThreadMessage")
        .update({ readAt: now.toISOString() })
        .eq("threadId", threadId)
        .is("readAt", null);
    }
    return true;
  }

  try {
    await prisma.communicationThread.update({
      where: { id: threadId },
      data: {
        ...(patch.status ? { status: patch.status as never } : {}),
        ...(patch.important !== undefined ? { important: patch.important } : {}),
        ...(patch.assignedAdminId !== undefined ? { assignedAdminId: patch.assignedAdminId } : {}),
        ...(patch.assignedStaffName !== undefined ? { assignedStaffName: patch.assignedStaffName } : {}),
        ...(patch.markRead ? { unreadCount: 0 } : {}),
        ...(patch.markUnread ? { unreadCount: 1 } : {}),
        ...(patch.unreadCount !== undefined ? { unreadCount: patch.unreadCount } : {}),
      },
    });
    if (patch.markRead) {
      await prisma.communicationThreadMessage.updateMany({
        where: { threadId, readAt: null },
        data: { readAt: now },
      });
    }
    return true;
  } catch {
    return false;
  }
}
