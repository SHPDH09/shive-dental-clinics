import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { addDays, endOfDay, startOfDay } from "date-fns";

export async function listAppointmentsAdmin(options: {
  page: number;
  limit: number;
  status?: string | null;
  treatment?: string | null;
  today?: string | null;
  tomorrow?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}) {
  const sb = createSupabaseServiceClient();
  const from = (options.page - 1) * options.limit;
  const to = from + options.limit - 1;

  let query = sb.from("Appointment").select("*", { count: "exact" });

  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (options.treatment) {
    query = query.ilike("treatmentName", `%${options.treatment}%`);
  }

  if (options.today === "true" || options.today === "1") {
    query = query
      .gte("appointmentDate", startOfDay(new Date()).toISOString())
      .lte("appointmentDate", endOfDay(new Date()).toISOString());
  } else if (options.tomorrow === "true" || options.tomorrow === "1") {
    const day = addDays(new Date(), 1);
    query = query
      .gte("appointmentDate", startOfDay(day).toISOString())
      .lte("appointmentDate", endOfDay(day).toISOString());
  } else {
    if (options.dateFrom) {
      query = query.gte("appointmentDate", startOfDay(new Date(options.dateFrom)).toISOString());
    }
    if (options.dateTo) {
      query = query.lte("appointmentDate", endOfDay(new Date(options.dateTo)).toISOString());
    }
  }

  query = query
    .order("appointmentDate", { ascending: true })
    .order("appointmentTime", { ascending: true })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data ?? [], total: count ?? 0 };
}

export async function getAppointmentAdmin(id: string) {
  const sb = createSupabaseServiceClient();
  const { data, error } = await sb.from("Appointment").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateAppointmentAdmin(
  id: string,
  data: Record<string, unknown>,
) {
  const sb = createSupabaseServiceClient();
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  const { data: updated, error } = await sb
    .from("Appointment")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

export async function deleteAppointmentAdmin(id: string) {
  const sb = createSupabaseServiceClient();
  const { error } = await sb.from("Appointment").delete().eq("id", id);
  if (error) throw error;
}
