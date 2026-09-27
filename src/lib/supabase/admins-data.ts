import { createId } from "@paralleldrive/cuid2";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";

const adminSelect =
  "id, loginId, name, email, role, createdAt, updatedAt";

export async function listAdmins() {
  const sb = await getAdminSupabaseClient();
  const { data, error } = await sb.from("Admin").select(adminSelect).order("createdAt", {
    ascending: true,
  });
  if (error) throw error;
  return data ?? [];
}

export async function createAdminRow(input: {
  loginId: string;
  name: string;
  email: string | null;
  passwordHash: string;
  role: string;
}) {
  const sb = await getAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("Admin")
    .insert({
      id: createId(),
      ...input,
      createdAt: now,
      updatedAt: now,
    })
    .select("id, loginId, name, email, role, createdAt")
    .single();
  if (error) throw error;
  return data;
}

export async function findAdminById(id: string) {
  const sb = await getAdminSupabaseClient();
  const { data, error } = await sb.from("Admin").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateAdminRow(
  id: string,
  data: Record<string, unknown>,
) {
  const sb = await getAdminSupabaseClient();
  const { data: updated, error } = await sb
    .from("Admin")
    .update({ ...data, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select("id, loginId, name, email, role, updatedAt")
    .single();
  if (error) throw error;
  return updated;
}

export async function deleteAdminRow(id: string) {
  const sb = await getAdminSupabaseClient();
  const { error } = await sb.from("Admin").delete().eq("id", id);
  if (error) throw error;
}

export async function countSuperAdmins() {
  const sb = await getAdminSupabaseClient();
  const { count, error } = await sb
    .from("Admin")
    .select("*", { count: "exact", head: true })
    .eq("role", "SUPER_ADMIN");
  if (error) throw error;
  return count ?? 0;
}
