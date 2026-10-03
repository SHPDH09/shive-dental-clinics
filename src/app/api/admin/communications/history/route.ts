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
  const branchId = searchParams.get("branchId")?.trim();
  const campaignId = searchParams.get("campaignId")?.trim();
  const templateSlug = searchParams.get("template")?.trim();
  const staffId = searchParams.get("staff")?.trim();
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 200);

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    let query = sb.from("CommunicationLog").select("*").order("createdAt", { ascending: false }).limit(limit);
    if (channel) query = query.eq("channel", channel);
    if (status) query = query.eq("status", status);
    if (patientId) query = query.eq("patientId", patientId);
    if (leadId) query = query.eq("leadId", leadId);
    if (branchId) query = query.eq("branchId", branchId);
    if (campaignId) query = query.eq("campaignId", campaignId);
    if (templateSlug) query = query.eq("templateSlug", templateSlug);
    if (staffId) query = query.eq("sentByAdminId", staffId);
    if (from) query = query.gte("createdAt", from);
    if (to) query = query.lte("createdAt", to);
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
        ...(branchId ? { branchId } : {}),
        ...(campaignId ? { campaignId } : {}),
        ...(templateSlug ? { templateSlug } : {}),
        ...(staffId ? { sentByAdminId: staffId } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
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
