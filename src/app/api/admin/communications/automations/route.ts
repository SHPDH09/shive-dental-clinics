import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { z } from "zod";
import { NextResponse } from "next/server";

const patchSchema = z.object({
  id: z.string(),
  enabled: z.boolean().optional(),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "IN_APP"]).optional(),
  templateSlug: z.string().optional(),
  timingLabel: z.string().optional(),
});

export async function GET() {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data, error: qErr } = await sb
      .from("CommunicationAutomation")
      .select("*")
      .order("sortOrder", { ascending: true });
    if (qErr) return NextResponse.json({ items: [], warning: qErr.message });
    return NextResponse.json({ items: data ?? [] });
  }

  try {
    const items = await prisma.communicationAutomation.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function PATCH(req: Request) {
  const { error } = await requirePermission("messages", "edit");
  if (error) return error;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...update } = parsed.data;

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    await sb.from("CommunicationAutomation").update({ ...update, updatedAt: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  await prisma.communicationAutomation.update({ where: { id }, data: update });
  return NextResponse.json({ ok: true });
}
