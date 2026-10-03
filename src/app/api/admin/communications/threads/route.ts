import { requirePermission } from "@/lib/api-auth";
import { listThreads } from "@/lib/communications/threads";
import { buildUnifiedInbox } from "@/lib/communications/inbox";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;

  const sp = new URL(req.url).searchParams;
  const filters = {
    q: sp.get("q")?.trim(),
    channel: sp.get("channel")?.trim(),
    status: sp.get("status")?.trim(),
    branchId: sp.get("branchId")?.trim(),
    assignedAdminId: sp.get("staff")?.trim(),
    important: sp.get("important") === "1",
    unreadOnly: sp.get("unread") === "1",
    limit: Number(sp.get("limit") ?? "50"),
  };

  let items = await listThreads(filters);
  if (items.length === 0 && !sp.get("threadsOnly")) {
    const legacy = await buildUnifiedInbox(filters.limit);
    items = legacy.map((r) => ({
      id: r.id,
      channel: r.channel,
      status: r.status === "ARCHIVED" ? "ARCHIVED" : "OPEN",
      contactName: r.patientName,
      patientCode: r.patientCode,
      phone: r.phone,
      email: r.email,
      branchName: null,
      lastMessage: r.lastMessage,
      lastAt: r.lastAt,
      assignedStaff: r.assignedStaff,
      unreadCount: r.unreadCount,
      important: false,
      patientId: r.patientId,
      leadId: r.leadId,
      enquiryId: r.enquiryId,
    }));
  }

  return NextResponse.json({ items });
}
