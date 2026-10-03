import { requirePermission } from "@/lib/api-auth";
import { sendCommunication } from "@/lib/communications/send";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { z } from "zod";
import { NextResponse } from "next/server";

const schema = z.object({ logId: z.string() });

export async function POST(req: Request) {
  const { session, error } = await requirePermission("messages", "edit");
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "logId required" }, { status: 400 });
  }

  const { logId } = parsed.data;
  let row: Record<string, unknown> | null = null;

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data } = await sb.from("CommunicationLog").select("*").eq("id", logId).maybeSingle();
    row = data;
  } else {
    const r = await prisma.communicationLog.findUnique({ where: { id: logId } });
    row = r as unknown as Record<string, unknown>;
  }

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results = await sendCommunication({
    channels: [String(row.channel) as "EMAIL"],
    recipientName: String(row.recipientName ?? "Recipient"),
    phone: row.recipientPhone ? String(row.recipientPhone) : undefined,
    email: row.recipientEmail ? String(row.recipientEmail) : undefined,
    patientId: row.patientId ? String(row.patientId) : undefined,
    leadId: row.leadId ? String(row.leadId) : undefined,
    message: String(row.body),
    subject: row.subject ? String(row.subject) : undefined,
    sentByAdminId: session!.user.id,
  });

  return NextResponse.json({ results });
}
