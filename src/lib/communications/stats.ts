import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type CommunicationStats = {
  totalMessages: number;
  whatsAppSent: number;
  smsSent: number;
  emailsSent: number;
  pending: number;
  failed: number;
  unreadReplies: number;
};

async function loadLogs(limit = 5000) {
  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data, error } = await sb
      .from("CommunicationLog")
      .select("channel, status")
      .order("createdAt", { ascending: false })
      .limit(limit);
    if (error) return [];
    return data ?? [];
  }
  try {
    return await prisma.communicationLog.findMany({
      select: { channel: true, status: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch {
    return [];
  }
}

export async function getCommunicationStats(): Promise<CommunicationStats> {
  const rows = await loadLogs();
  let whatsAppSent = 0;
  let smsSent = 0;
  let emailsSent = 0;
  let pending = 0;
  let failed = 0;

  for (const r of rows) {
    const ch = String(r.channel);
    const st = String(r.status);
    if (st === "PENDING") pending += 1;
    if (st === "FAILED") failed += 1;
    if (st === "SENT" || st === "DELIVERED" || st === "READ") {
      if (ch === "WHATSAPP") whatsAppSent += 1;
      if (ch === "SMS") smsSent += 1;
      if (ch === "EMAIL") emailsSent += 1;
    }
  }

  let unreadReplies = 0;
  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { count } = await sb
      .from("Notification")
      .select("*", { count: "exact", head: true })
      .eq("read", false);
    unreadReplies = count ?? 0;
  } else {
    try {
      unreadReplies = await prisma.notification.count({ where: { read: false } });
    } catch {
      unreadReplies = 0;
    }
  }

  return {
    totalMessages: rows.length,
    whatsAppSent,
    smsSent,
    emailsSent,
    pending,
    failed,
    unreadReplies,
  };
}
