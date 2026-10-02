import { requirePermission } from "@/lib/api-auth";
import { listLeadsEnriched, mapLeadRowFromRecord } from "@/lib/leads/build-lead-dashboard";
import { generateLeadCode } from "@/lib/leads/lead-code";
import { logLeadActivity } from "@/lib/leads/lead-activity";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseCreate, supabaseList } from "@/lib/supabase/crud";
import { leadSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requirePermission("leads", "view");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(200, parseInt(searchParams.get("limit") || "50", 10));
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const source = searchParams.get("source")?.trim();
  const priority = searchParams.get("priority")?.trim();
  const assignedStaff = searchParams.get("assignedStaff")?.trim();
  const kanban = searchParams.get("kanban") === "1";

  try {
    if (!canUseSupabaseDataLayer()) {
      const { items, total } = await listLeadsEnriched({
        page: kanban ? 1 : page,
        limit: kanban ? 500 : limit,
        q,
        status: status || undefined,
        source: source || undefined,
        priority: priority || undefined,
        assignedStaff: assignedStaff || undefined,
      });
      return NextResponse.json({ items, total, page, limit });
    }

    const { items, total } = await supabaseList("lead", {
      page,
      limit: kanban ? 500 : limit,
      q,
      status: status || undefined,
      searchFields: q ? ["name", "phone", "email", "leadCode", "interestedService"] : undefined,
    });
    return NextResponse.json({
      items: (items as Record<string, unknown>[]).map(mapLeadRowFromRecord),
      total,
      page,
      limit,
    });
  } catch (e) {
    console.error("GET /api/admin/leads:", e);
    return NextResponse.json({ items: [], total: 0, page, limit });
  }
}

export async function POST(req: Request) {
  const { session, error } = await requirePermission("leads", "create");
  if (error) return error;

  const parsed = leadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const leadCode = await generateLeadCode();
  const payload = {
    leadCode,
    name: data.name,
    phone: data.phone,
    whatsAppNumber: data.whatsAppNumber || null,
    email: data.email || null,
    age: data.age ?? null,
    source: data.source,
    sourceCustom: data.sourceCustom || null,
    interestedService: data.interestedService || "General enquiry",
    preferredBranchId: data.preferredBranchId || null,
    preferredDoctorId: data.preferredDoctorId || null,
    status: data.status ?? "NEW",
    priority: data.priority ?? "MEDIUM",
    followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : null,
    followUpTime: data.followUpTime || null,
    notes: data.notes || null,
    assignedStaff: data.assignedStaff || null,
  };

  try {
    let lead: { id: string; name: string; leadCode: string };

    if (canUseSupabaseDataLayer()) {
      lead = (await supabaseCreate("lead", payload)) as { id: string; name: string; leadCode: string };
    } else {
      lead = await prisma.lead.create({
        data: {
          ...payload,
          source: data.source as "WEBSITE",
          status: (data.status as "NEW") ?? "NEW",
          priority: (data.priority as "MEDIUM") ?? "MEDIUM",
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        },
      });
    }

    await logLeadActivity({
      leadId: lead.id,
      kind: "created",
      title: "Lead created manually",
      createdBy: session!.user.id,
    });

    await createNotification({
      type: "NEW_LEAD",
      title: "New lead",
      message: `${lead.name} (${lead.leadCode})`,
      link: "/admin/leads",
    });

    return NextResponse.json(lead);
  } catch (e) {
    console.error("POST /api/admin/leads:", e);
    return NextResponse.json({ error: "Could not create lead" }, { status: 500 });
  }
}
