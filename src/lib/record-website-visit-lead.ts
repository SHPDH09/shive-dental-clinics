import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { getAdminWriteSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

export type WebsiteVisitPayload = {
  visitorId: string;
  path: string;
  referrer?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  queryKeys?: string[];
  userAgent?: string | null;
  clientIp?: string | null;
};

type VisitNotes = {
  type: "auto_website_visit";
  visitorId: string;
  path: string;
  referrer?: string | null;
  queryKeys?: string[];
  userAgent?: string | null;
  ipHint?: string | null;
  visits: number;
  lastSeenAt: string;
};

function parseNotes(raw: string | null | undefined): VisitNotes | null {
  if (!raw?.trim().startsWith("{")) return null;
  try {
    const j = JSON.parse(raw) as VisitNotes;
    if (j.type === "auto_website_visit" && j.visitorId) return j;
  } catch {
    /* ignore */
  }
  return null;
}

function displayName(p: WebsiteVisitPayload): string {
  const n = p.name?.trim();
  if (n && n.length >= 2) return n;
  return "Website visitor";
}

function displayPhone(p: WebsiteVisitPayload): string {
  const ph = p.phone?.trim().replace(/\s/g, "");
  if (ph && ph.length >= 6) return ph;
  return "Not provided";
}

function mergeContact(existing: { name: string; phone: string; email: string | null }, p: WebsiteVisitPayload) {
  const name = displayName(p);
  const phone = displayPhone(p);
  const email = p.email?.trim() || null;
  return {
    name: existing.name === "Website visitor" && name !== "Website visitor" ? name : existing.name || name,
    phone: existing.phone === "Not provided" && phone !== "Not provided" ? phone : existing.phone || phone,
    email: existing.email || email,
  };
}

async function findRecentVisitLead(visitorId: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (useSupabaseCrud()) {
    const sb = await getAdminWriteSupabaseClient();
    const { data, error } = await sb
      .from("Lead")
      .select("id,name,phone,email,notes,createdAt")
      .gte("createdAt", since.toISOString())
      .order("createdAt", { ascending: false })
      .limit(80);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      const meta = parseNotes(String(row.notes ?? ""));
      if (meta?.visitorId === visitorId) return row;
    }
    return null;
  }

  const rows = await prisma.lead.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: { id: true, name: true, phone: true, email: true, notes: true },
  });
  for (const row of rows) {
    const meta = parseNotes(row.notes);
    if (meta?.visitorId === visitorId) return row;
  }
  return null;
}

export async function recordWebsiteVisitLead(
  payload: WebsiteVisitPayload,
): Promise<{ id: string; created: boolean; updated: boolean }> {
  const visitorId = payload.visitorId.trim();
  if (!visitorId || visitorId.length < 8) throw new Error("Invalid visitor id");

  const existing = await findRecentVisitLead(visitorId);
  const now = new Date().toISOString();
  const ipHint = payload.clientIp ? payload.clientIp.replace(/\.\d+$/, ".x") : null;

  if (existing) {
    const prev = parseNotes(String(existing.notes ?? ""));
    const notes: VisitNotes = {
      type: "auto_website_visit",
      visitorId,
      path: payload.path,
      referrer: payload.referrer ?? prev?.referrer ?? null,
      queryKeys: payload.queryKeys ?? prev?.queryKeys,
      userAgent: payload.userAgent ?? prev?.userAgent ?? null,
      ipHint: ipHint ?? prev?.ipHint ?? null,
      visits: (prev?.visits ?? 1) + 1,
      lastSeenAt: now,
    };
    const contact = mergeContact(
      {
        name: String(existing.name),
        phone: String(existing.phone),
        email: existing.email ? String(existing.email) : null,
      },
      payload,
    );

    if (useSupabaseCrud()) {
      const sb = await getAdminWriteSupabaseClient();
      const { error } = await sb
        .from("Lead")
        .update({
          ...contact,
          notes: JSON.stringify(notes),
          interestedService: payload.path,
          updatedAt: now,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: String(existing.id), created: false, updated: true };
    }

    await prisma.lead.update({
      where: { id: String(existing.id) },
      data: {
        ...contact,
        notes: JSON.stringify(notes),
        interestedService: payload.path,
      },
    });
    return { id: String(existing.id), created: false, updated: true };
  }

  const notes: VisitNotes = {
    type: "auto_website_visit",
    visitorId,
    path: payload.path,
    referrer: payload.referrer ?? null,
    queryKeys: payload.queryKeys,
    userAgent: payload.userAgent ?? null,
    ipHint,
    visits: 1,
    lastSeenAt: now,
  };

  const row = {
    name: displayName(payload),
    phone: displayPhone(payload),
    email: payload.email?.trim() || null,
    source: "WEBSITE" as const,
    status: "NEW" as const,
    interestedService: payload.path,
    notes: JSON.stringify(notes),
  };

  const id = createId();
  const ts = now;

  if (useSupabaseCrud()) {
    const sb = await getAdminWriteSupabaseClient();
    const { error } = await sb.from("Lead").insert({ id, ...row, createdAt: ts, updatedAt: ts });
    if (error) throw new Error(error.message);
    return { id, created: true, updated: false };
  }

  const created = await prisma.lead.create({ data: { id, ...row } });
  return { id: created.id, created: true, updated: false };
}
