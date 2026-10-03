import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type AudienceFilter = {
  branchId?: string;
  doctorId?: string;
  serviceId?: string;
  patientStatus?: string;
  leadStatus?: string;
  monthsSinceVisit?: number;
  hasFollowUpDue?: boolean;
};

export type AudienceRecipient = {
  id: string;
  type: "patient" | "lead";
  name: string;
  phone: string | null;
  email: string | null;
};

export async function countAudience(filter: AudienceFilter): Promise<number> {
  const list = await resolveAudience(filter, 5000);
  return list.length;
}

export async function resolveAudience(
  filter: AudienceFilter,
  limit = 500,
): Promise<AudienceRecipient[]> {
  const out: AudienceRecipient[] = [];

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    let q = sb.from("Patient").select("id, name, phone, email, status, preferredBranchId").eq("status", "ACTIVE");
    if (filter.branchId) q = q.eq("preferredBranchId", filter.branchId);
    if (filter.patientStatus) q = q.eq("status", filter.patientStatus);
    const { data: patients } = await q.limit(limit);
    for (const p of patients ?? []) {
      out.push({
        id: String(p.id),
        type: "patient",
        name: String(p.name),
        phone: p.phone ? String(p.phone) : null,
        email: p.email ? String(p.email) : null,
      });
    }

    if (filter.leadStatus) {
      const { data: leads } = await sb
        .from("Lead")
        .select("id, name, phone, email, status")
        .eq("status", filter.leadStatus)
        .limit(Math.max(0, limit - out.length));
      for (const l of leads ?? []) {
        out.push({
          id: String(l.id),
          type: "lead",
          name: String(l.name),
          phone: l.phone ? String(l.phone) : null,
          email: l.email ? String(l.email) : null,
        });
      }
    }
    return out.slice(0, limit);
  }

  const patients = await prisma.patient.findMany({
    where: {
      status: (filter.patientStatus ?? "ACTIVE") as never,
      ...(filter.branchId ? { preferredBranchId: filter.branchId } : {}),
    },
    select: { id: true, name: true, phone: true, email: true },
    take: limit,
  });
  for (const p of patients) {
    out.push({ id: p.id, type: "patient", name: p.name, phone: p.phone, email: p.email });
  }

  if (filter.leadStatus && out.length < limit) {
    const leads = await prisma.lead.findMany({
      where: { status: filter.leadStatus as never },
      select: { id: true, name: true, phone: true, email: true },
      take: limit - out.length,
    });
    for (const l of leads) {
      out.push({ id: l.id, type: "lead", name: l.name, phone: l.phone, email: l.email });
    }
  }

  return out;
}
