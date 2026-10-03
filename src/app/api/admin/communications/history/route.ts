import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const channel = searchParams.get("channel")?.trim();
  const status = searchParams.get("status")?.trim();
  const patientId = searchParams.get("patientId")?.trim();
  const leadId = searchParams.get("leadId")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 200);

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    let query = sb.from("CommunicationLog").select("*").order("createdAt", { ascending: false }).limit(limit);
    if (channel) query = query.eq("channel", channel);
    if (status) query = query.eq("status", status);
    if (patientId) query = query.eq("patientId", patientId);
    if (leadId) query = query.eq("leadId", leadId);
    const { data, error: qErr } = await query;
    if (qErr) return NextResponse.json({ items: [], warning: qErr.message });
    let items = data ?? [];
    if (q) {
      const lower = q.toLowerCase();
      items = items.filter(
        (r) =>
          String(r.recipientName ?? "").toLowerCase().includes(lower) ||
          String(r.body ?? "").toLowerCase().includes(lower),
      );
    }
    return NextResponse.json({ items });
  }

  try {
    const items = await prisma.communicationLog.findMany({
      where: {
        ...(channel ? { channel: channel as never } : {}),
        ...(status ? { status: status as never } : {}),
        ...(patientId ? { patientId } : {}),
        ...(leadId ? { leadId } : {}),
        ...(q
          ? {
              OR: [
                { recipientName: { contains: q, mode: "insensitive" } },
                { body: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
