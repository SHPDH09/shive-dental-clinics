import { requirePermission } from "@/lib/api-auth";
import { getLeadProfileForAdmin } from "@/lib/leads/build-lead-profile";
import { logLeadActivity } from "@/lib/leads/lead-activity";
import { LEAD_STATUS_LABEL } from "@/lib/leads/lead-pipeline";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseFindUnique, supabaseUpdate } from "@/lib/supabase/crud";
import { leadSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { error } = await requirePermission("leads", "view");
  if (error) return error;

  const { id } = await context.params;
  const full = new URL(req.url).searchParams.get("profile") === "full";

  if (full) {
    const profile = await getLeadProfileForAdmin(id);
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(profile);
  }

  if (canUseSupabaseDataLayer()) {
    const item = await supabaseFindUnique("lead", id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  }

  const item = await prisma.lead.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("leads", "edit");
  if (error) return error;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = leadSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) update[k] = v === "" ? null : v;
  }
  if (data.followUpDate !== undefined) {
    update.followUpDate =
      data.followUpDate === null || data.followUpDate === ""
        ? null
        : new Date(data.followUpDate).toISOString();
  }
  if (body.status && typeof body.status === "string") {
    update.status = body.status;
  }

  let beforeStatus: string | null = null;

  try {
    if (canUseSupabaseDataLayer()) {
      const before = await supabaseFindUnique("lead", id);
      if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
      beforeStatus = String((before as Record<string, unknown>).status ?? "");
      const item = await supabaseUpdate("lead", id, update);
      if (update.status && update.status !== beforeStatus) {
        await logLeadActivity({
          leadId: id,
          kind: "status",
          title: `Status → ${LEAD_STATUS_LABEL[String(update.status)] ?? update.status}`,
          createdBy: session!.user.id,
        });
      }
      return NextResponse.json(item);
    }

    const before = await prisma.lead.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
    beforeStatus = before.status;

    const item = await prisma.lead.update({
      where: { id },
      data: {
        ...update,
        followUpDate:
          data.followUpDate === undefined
            ? undefined
            : data.followUpDate
              ? new Date(data.followUpDate)
              : null,
        lastContactAt: body.markContact ? new Date() : undefined,
      } as Parameters<typeof prisma.lead.update>[0]["data"],
    });

    if (update.status && update.status !== beforeStatus) {
      await logLeadActivity({
        leadId: id,
        kind: "status",
        title: `Status → ${LEAD_STATUS_LABEL[String(update.status)] ?? update.status}`,
        createdBy: session!.user.id,
      });
    }

    return NextResponse.json(item);
  } catch (e) {
    console.error("PATCH lead:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("leads", "delete");
  if (error) return error;

  const { id } = await context.params;

  try {
    if (canUseSupabaseDataLayer()) {
      await supabaseUpdate("lead", id, { status: "LOST" });
    } else {
      await prisma.lead.update({ where: { id }, data: { status: "LOST" } });
    }
    await logLeadActivity({
      leadId: id,
      kind: "closed",
      title: "Lead marked as lost",
      createdBy: session!.user.id,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
