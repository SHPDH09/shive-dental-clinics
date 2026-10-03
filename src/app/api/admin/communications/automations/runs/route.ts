import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;

  const automationId = new URL(req.url).searchParams.get("automationId")?.trim();
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? "50"), 100);

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    let q = sb.from("CommunicationAutomationRun").select("*").order("createdAt", { ascending: false }).limit(limit);
    if (automationId) q = q.eq("automationId", automationId);
    const { data, error: qErr } = await q;
    if (qErr) return NextResponse.json({ items: [], warning: qErr.message });
    return NextResponse.json({ items: data ?? [] });
  }

  try {
    const items = await prisma.communicationAutomationRun.findMany({
      where: automationId ? { automationId } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
