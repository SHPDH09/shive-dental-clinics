import { createId } from "@paralleldrive/cuid2";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";

export const adminPublicSelect =
  "id, loginId, name, email, phone, profilePhotoUrl, role, branchId, active, lastLoginAt, permissions, createdAt, updatedAt";

export type AdminListFilters = {
  q?: string;
  role?: string;
  branchId?: string;
  active?: boolean;
  lastLoginFrom?: string;
  lastLoginTo?: string;
  createdFrom?: string;
  createdTo?: string;
};

export async function listAdmins(filters: AdminListFilters = {}) {
  const sb = await getAdminSupabaseClient();
  let query = sb.from("Admin").select(adminPublicSelect).order("createdAt", { ascending: false });

  if (filters.role) query = query.eq("role", filters.role);
  if (filters.branchId) query = query.eq("branchId", filters.branchId);
  if (filters.active !== undefined) query = query.eq("active", filters.active);
  if (filters.lastLoginFrom) query = query.gte("lastLoginAt", filters.lastLoginFrom);
  if (filters.lastLoginTo) query = query.lte("lastLoginAt", filters.lastLoginTo);
  if (filters.createdFrom) query = query.gte("createdAt", filters.createdFrom);
  if (filters.createdTo) query = query.lte("createdAt", filters.createdTo);

  const { data, error } = await query;
  if (error) throw error;
  let rows = data ?? [];

  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        String(r.name ?? "").toLowerCase().includes(q) ||
        String(r.email ?? "").toLowerCase().includes(q) ||
        String(r.loginId ?? "").toLowerCase().includes(q),
    );
  }

  return rows;
}

export async function createAdminRow(input: {
  loginId: string;
  name: string;
  email: string | null;
  phone?: string | null;
  profilePhotoUrl?: string | null;
  passwordHash: string;
  role: string;
  branchId?: string | null;
  active?: boolean;
  permissions?: unknown;
}) {
  const sb = await getAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("Admin")
    .insert({
      id: createId(),
      ...input,
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    })
    .select(adminPublicSelect)
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

export async function findAdminByLogin(loginId: string) {
  const sb = await getAdminSupabaseClient();
  const { data, error } = await sb
    .from("Admin")
    .select("*")
    .or(`loginId.eq.${loginId},email.eq.${loginId}`)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateAdminRow(id: string, data: Record<string, unknown>) {
  const sb = await getAdminSupabaseClient();
  const { data: updated, error } = await sb
    .from("Admin")
    .update({ ...data, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select(adminPublicSelect)
    .single();
  if (error) throw new Error(error.message);
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

export async function listAdminActivity(limit = 30) {
  const sb = await getAdminSupabaseClient();
  const { data, error } = await sb
    .from("AdminActivityLog")
    .select("id, adminId, adminName, action, entityType, entityId, entityLabel, createdAt")
    .order("createdAt", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
