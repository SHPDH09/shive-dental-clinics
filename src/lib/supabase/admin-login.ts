import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseProjectUrl,
  getSupabasePublishableKey,
  getSupabaseSecretKey,
} from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type AdminRow = {
  id: string;
  loginId: string;
  name: string;
  email: string | null;
  passwordHash: string;
  role: string;
};

async function findAdminRow(loginId: string): Promise<AdminRow | null> {
  if (!getSupabaseSecretKey()) return null;
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("Admin")
      .select("id, loginId, name, email, passwordHash, role")
      .or(`loginId.eq.${loginId},email.eq.${loginId}`)
      .maybeSingle();
    if (error || !data) return null;
    return data as AdminRow;
  } catch {
    return null;
  }
}

/** Supabase Auth (email) first; Admin table password when service key is available. */
export async function authenticateAdmin(loginId: string, password: string) {
  const trimmed = loginId.trim();
  const admin = await findAdminRow(trimmed);
  let email = admin?.email ?? (trimmed.includes("@") ? trimmed : null);

  const publishable = getSupabasePublishableKey();
  if (email && publishable) {
    const authClient = createClient(getSupabaseProjectUrl(), publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && authData.user) {
      const meta = authData.user.user_metadata as { role?: string; name?: string };
      return {
        id: admin?.id ?? authData.user.id,
        email,
        name: admin?.name ?? meta.name ?? "Shiv Dental Admin",
        role: admin?.role ?? meta.role ?? "SUPER_ADMIN",
      };
    }
  }

  if (admin) {
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (valid) {
      return {
        id: admin.id,
        email: admin.email ?? admin.loginId,
        name: admin.name,
        role: admin.role,
      };
    }
  }

  return null;
}
