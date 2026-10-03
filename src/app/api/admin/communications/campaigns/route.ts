import { requirePermission } from "@/lib/api-auth";
import { countAudience } from "@/lib/communications/audience";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { z } from "zod";
import { NextResponse } from "next/server";

const createSchema = z.object({
  name: z.string().min(2),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL"]),
  audienceFilter: z.record(z.string(), z.unknown()).optional(),
  messageBody: z.string().min(1),
  templateSlug: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export async function GET() {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data } = await sb.from("CommunicationCampaign").select("*").order("createdAt", { ascending: false });
    return NextResponse.json({ items: data ?? [] });
  }

  try {
    const items = await prisma.communicationCampaign.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: Request) {
  const { session, error } = await requirePermission("messages", "create");
  if (error) return error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const audienceFilter = d.audienceFilter ?? {};
  const recipientCount = await countAudience(audienceFilter as never);

  const row = {
    id: createId(),
    name: d.name,
    channel: d.channel,
    status: d.scheduledAt ? "SCHEDULED" : "DRAFT",
    audienceFilter,
    messageBody: d.messageBody,
    templateSlug: d.templateSlug ?? null,
    recipientCount,
    scheduledAt: d.scheduledAt ?? null,
    createdBy: session!.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    await sb.from("CommunicationCampaign").insert(row);
  } else {
    await prisma.communicationCampaign.create({
      data: {
        name: d.name,
        channel: d.channel,
        status: d.scheduledAt ? "SCHEDULED" : "DRAFT",
        audienceFilter: audienceFilter as object,
        messageBody: d.messageBody,
        templateSlug: d.templateSlug,
        recipientCount,
        scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : null,
        createdBy: session!.user.id,
      },
    });
  }

  return NextResponse.json({ ok: true, recipientCount });
}
