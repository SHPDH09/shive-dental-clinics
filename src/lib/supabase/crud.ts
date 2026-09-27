import { createId } from "@paralleldrive/cuid2";
import {
  canUseSupabaseDataLayer,
  getAdminSupabaseClient,
  getAdminWriteSupabaseClient,
} from "@/lib/supabase/data-client";
import { errorMessageFromUnknown, mapSupabaseErrorMessage } from "@/lib/supabase/errors";
import { NextResponse } from "next/server";

function supabaseHttpStatus(message: string): number {
  if (/permission denied|row-level security|RLS|42501/i.test(message)) return 403;
  if (/Could not find the table|does not exist|PGRST205/i.test(message)) return 503;
  return 400;
}

export type SupabaseModelName =
  | "Patient"
  | "Appointment"
  | "Lead"
  | "Service"
  | "ServiceCategory"
  | "Doctor"
  | "Testimonial"
  | "Media"
  | "BeforeAfter"
  | "Enquiry"
  | "MessageTemplate"
  | "HeroStat"
  | "HeroSlide"
  | "Notification"
  | "Branch"
  | "Admin";

const modelToTable: Record<string, SupabaseModelName> = {
  patient: "Patient",
  appointment: "Appointment",
  lead: "Lead",
  service: "Service",
  serviceCategory: "ServiceCategory",
  doctor: "Doctor",
  testimonial: "Testimonial",
  media: "Media",
  beforeAfter: "BeforeAfter",
  enquiry: "Enquiry",
  messageTemplate: "MessageTemplate",
  heroStat: "HeroStat",
  heroSlide: "HeroSlide",
  notification: "Notification",
  branch: "Branch",
};

export function useSupabaseCrud(): boolean {
  return canUseSupabaseDataLayer();
}

function tableFor(model: string): SupabaseModelName {
  const t = modelToTable[model];
  if (!t) throw new Error(`Unknown model: ${model}`);
  return t;
}

export async function supabaseList(
  model: string,
  options: {
    page: number;
    limit: number;
    q?: string;
    status?: string;
    searchFields?: string[];
  },
) {
  const table = tableFor(model);
  const from = (options.page - 1) * options.limit;
  const to = from + options.limit - 1;
  const sb = await getAdminSupabaseClient();

  let query = sb.from(table).select("*", { count: "exact" });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.q && options.searchFields?.length) {
    const parts = options.searchFields.map((f) => `${f}.ilike.%${options.q}%`);
    query = query.or(parts.join(","));
  }

  if (table === "ServiceCategory") {
    query = query.order("sortOrder", { ascending: true }).order("name", { ascending: true }).range(from, to);
  } else if (table === "HeroSlide") {
    query = query.order("sortOrder", { ascending: true }).range(from, to);
  } else {
    const orderCol = table === "HeroStat" ? "updatedAt" : "createdAt";
    query = query.order(orderCol, { ascending: false }).range(from, to);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data ?? [], total: count ?? 0 };
}

export async function supabaseCreate(model: string, data: Record<string, unknown>) {
  const table = tableFor(model);
  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    id: (data.id as string) ?? createId(),
    ...data,
  };
  if (table !== "HeroStat" && table !== "Notification") {
    row.createdAt = data.createdAt ?? now;
    row.updatedAt = data.updatedAt ?? now;
  } else if (table === "HeroStat") {
    row.updatedAt = data.updatedAt ?? now;
  } else if (table === "Notification") {
    row.createdAt = data.createdAt ?? now;
  }

  const sb = await getAdminWriteSupabaseClient();
  const { data: created, error } = await sb.from(table).insert(row).select().single();
  if (error) {
    throw new Error(error.message);
  }
  return created;
}

export async function supabaseFindUnique(model: string, id: string) {
  const table = tableFor(model);
  const sb = await getAdminSupabaseClient();
  const { data, error } = await sb.from(table).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function supabaseUpdate(model: string, id: string, data: Record<string, unknown>) {
  const table = tableFor(model);
  const sb = await getAdminWriteSupabaseClient();
  const { data: updated, error } = await sb
    .from(table)
    .update({ ...data, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

export async function supabaseDelete(model: string, id: string) {
  const table = tableFor(model);
  const sb = await getAdminWriteSupabaseClient();
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function supabaseCount(model: string, filter?: Record<string, string>) {
  const table = tableFor(model);
  const sb = await getAdminSupabaseClient();
  let query = sb.from(table).select("*", { count: "exact", head: true });
  if (filter) {
    for (const [k, v] of Object.entries(filter)) {
      query = query.eq(k, v);
    }
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export function supabaseCrudHandlers(
  model: string,
  options?: { searchFields?: string[] },
) {
  return {
    async GET(req: Request) {
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
      const q = searchParams.get("q")?.trim();
      const status = searchParams.get("status") ?? undefined;

      try {
        const { items, total } = await supabaseList(model, {
          page,
          limit,
          q,
          status,
          searchFields: options?.searchFields,
        });
        return NextResponse.json({ items, total, page, limit });
      } catch (e) {
        const msg = mapSupabaseErrorMessage(errorMessageFromUnknown(e));
        console.error("Supabase list error:", e);
        return NextResponse.json({ error: msg }, { status: supabaseHttpStatus(msg) });
      }
    },

    async POST(req: Request) {
      try {
        const data = await req.json();
        const item = await supabaseCreate(model, data);
        return NextResponse.json(item);
      } catch (e) {
        const msg = mapSupabaseErrorMessage(errorMessageFromUnknown(e));
        console.error("Supabase create error:", e);
        return NextResponse.json({ error: msg }, { status: supabaseHttpStatus(msg) });
      }
    },
  };
}

export async function supabaseCrudById(model: string, req: Request, id: string) {
  if (req.method === "GET") {
    try {
      const item = await supabaseFindUnique(model, id);
      if (!item) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
      return { data: item };
    } catch (e) {
      console.error(e);
      return { error: NextResponse.json({ error: "Database error" }, { status: 503 }) };
    }
  }

  if (req.method === "PATCH") {
    try {
      const data = await req.json();
      const item = await supabaseUpdate(model, id, data);
      return { data: item };
    } catch (e) {
      console.error(e);
      return { error: NextResponse.json({ error: "Database error" }, { status: 503 }) };
    }
  }

  if (req.method === "DELETE") {
    try {
      await supabaseDelete(model, id);
      return { data: { success: true } };
    } catch (e) {
      console.error(e);
      return { error: NextResponse.json({ error: "Database error" }, { status: 503 }) };
    }
  }

  return { error: NextResponse.json({ error: "Method not allowed" }, { status: 405 }) };
}
