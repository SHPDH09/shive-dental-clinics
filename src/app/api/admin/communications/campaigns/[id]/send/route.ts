import { requirePermission } from "@/lib/api-auth";
import { resolveAudience } from "@/lib/communications/audience";
import { sendCommunication } from "@/lib/communications/send";
import { renderTemplate } from "@/lib/communications/template-render";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("messages", "create");
  if (error) return error;

  const body = (await req.json()) as { confirmed?: boolean };
  if (!body.confirmed) {
    return NextResponse.json({ error: "Bulk send requires confirmed: true" }, { status: 400 });
  }

  const { id } = await context.params;

  let campaign: {
    channel: "WHATSAPP" | "SMS" | "EMAIL";
    messageBody: string;
    audienceFilter: unknown;
    recipientCount: number;
  } | null = null;

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data } = await sb.from("CommunicationCampaign").select("*").eq("id", id).maybeSingle();
    if (data) {
      campaign = {
        channel: data.channel as "WHATSAPP" | "SMS" | "EMAIL",
        messageBody: String(data.messageBody ?? ""),
        audienceFilter: data.audienceFilter,
        recipientCount: Number(data.recipientCount ?? 0),
      };
    }
  } else {
    const row = await prisma.communicationCampaign.findUnique({ where: { id } });
    if (row) {
      campaign = {
        channel: row.channel as "WHATSAPP" | "SMS" | "EMAIL",
        messageBody: row.messageBody ?? "",
        audienceFilter: row.audienceFilter,
        recipientCount: row.recipientCount,
      };
    }
  }

  if (!campaign?.messageBody) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const audience = await resolveAudience((campaign.audienceFilter ?? {}) as never, 200);
  let sent = 0;
  let failed = 0;

  for (const r of audience) {
    const message = renderTemplate(campaign.messageBody, { patient_name: r.name });
    const results = await sendCommunication({
      channels: [campaign.channel],
      recipientName: r.name,
      phone: r.phone,
      email: r.email,
      patientId: r.type === "patient" ? r.id : undefined,
      leadId: r.type === "lead" ? r.id : undefined,
      message,
      sentByAdminId: session!.user.id,
      marketing: true,
    });
    if (results[0]?.ok) sent += 1;
    else failed += 1;
  }

  const status = "COMPLETED";
  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    await sb
      .from("CommunicationCampaign")
      .update({ status, sentCount: sent, failedCount: failed, updatedAt: new Date().toISOString() })
      .eq("id", id);
  } else {
    await prisma.communicationCampaign.update({
      where: { id },
      data: { status, sentCount: sent, failedCount: failed },
    });
  }

  return NextResponse.json({ sent, failed, total: audience.length });
}
