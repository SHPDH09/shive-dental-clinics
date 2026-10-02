import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { supabaseFindUnique, useSupabaseCrud } from "@/lib/supabase/crud";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL } from "@/lib/leads/lead-pipeline";

export async function getLeadProfileForAdmin(leadId: string) {
  if (useSupabaseCrud()) {
    const row = await supabaseFindUnique("lead", leadId);
    if (!row) return null;
    const p = row as Record<string, unknown>;
    const sb = await getAdminSupabaseClient();
    let activities: Record<string, unknown>[] = [];
    try {
      const { data } = await sb
        .from("LeadActivity")
        .select("*")
        .eq("leadId", leadId)
        .order("at", { ascending: false })
        .limit(50);
      activities = data ?? [];
    } catch {
      /* table optional */
    }
    let branchName: string | null = null;
    let doctorName: string | null = null;
    if (p.preferredBranchId) {
      const { data: b } = await sb
        .from("Branch")
        .select("name")
        .eq("id", String(p.preferredBranchId))
        .maybeSingle();
      branchName = b?.name ? String(b.name) : null;
    }
    if (p.preferredDoctorId) {
      const { data: d } = await sb
        .from("Doctor")
        .select("name")
        .eq("id", String(p.preferredDoctorId))
        .maybeSingle();
      doctorName = d?.name ? String(d.name) : null;
    }
    return assembleProfile(p, activities, branchName, doctorName);
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      preferredBranch: { select: { name: true } },
      preferredDoctor: { select: { name: true } },
      activities: { orderBy: { at: "desc" }, take: 50 },
    },
  });
  if (!lead) return null;

  return assembleProfile(
    {
      ...lead,
      createdAt: lead.createdAt.toISOString(),
      followUpDate: lead.followUpDate?.toISOString() ?? null,
      lastContactAt: lead.lastContactAt?.toISOString() ?? null,
      preferredBranchId: lead.preferredBranchId,
      preferredDoctorId: lead.preferredDoctorId,
    } as Record<string, unknown>,
    lead.activities.map((a) => ({
      ...a,
      at: a.at.toISOString(),
    })),
    lead.preferredBranch?.name ?? null,
    lead.preferredDoctor?.name ?? null,
  );
}

function assembleProfile(
  p: Record<string, unknown>,
  activities: Record<string, unknown>[],
  branchName: string | null,
  doctorName: string | null,
) {
  const source = String(p.source ?? "WEBSITE");
  const timeline = [
    {
      at: String(p.createdAt),
      label: format(new Date(String(p.createdAt)), "dd MMM yyyy"),
      title: `Lead created — ${LEAD_SOURCE_LABEL[source] ?? source}`,
      kind: "created",
    },
    ...activities.map((a) => ({
      at: String(a.at),
      label: format(new Date(String(a.at)), "dd MMM yyyy"),
      title: String(a.title),
      kind: String(a.kind),
      detail: (a.detail as string | null) ?? null,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    id: String(p.id),
    leadCode: String(p.leadCode ?? ""),
    name: String(p.name ?? ""),
    phone: String(p.phone ?? ""),
    whatsAppNumber: (p.whatsAppNumber as string | null) ?? null,
    email: (p.email as string | null) ?? null,
    age: typeof p.age === "number" ? p.age : null,
    source,
    sourceLabel: LEAD_SOURCE_LABEL[source] ?? source,
    sourceCustom: (p.sourceCustom as string | null) ?? null,
    interestedService: (p.interestedService as string | null) ?? null,
    branchName,
    doctorName,
    status: String(p.status ?? "NEW"),
    statusLabel: LEAD_STATUS_LABEL[String(p.status)] ?? String(p.status),
    priority: String(p.priority ?? "MEDIUM"),
    assignedStaff: (p.assignedStaff as string | null) ?? null,
    followUpDate: p.followUpDate ? String(p.followUpDate) : null,
    followUpTime: (p.followUpTime as string | null) ?? null,
    lastContactAt: p.lastContactAt ? String(p.lastContactAt) : null,
    notes: (p.notes as string | null) ?? null,
    patientId: (p.patientId as string | null) ?? null,
    createdAt: String(p.createdAt),
    timeline,
  };
}
