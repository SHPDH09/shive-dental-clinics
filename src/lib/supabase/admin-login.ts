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
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("Admin")
    .select("id, loginId, name, email, passwordHash, role")
    .or(`loginId.eq.${loginId},email.eq.${loginId}`)
    .maybeSingle();
  if (error || !data) return null;
  return data as AdminRow;
}

/** Supabase Auth + Admin table (no Cloudflare env password). */
export async function authenticateAdmin(loginId: string, password: string) {
  const admin = await findAdminRow(loginId);
  if (!admin) return null;

  const email = admin.email ?? (loginId.includes("@") ? loginId : null);

  if (email) {
    const publishable = getSupabasePublishableKey();
    if (publishable) {
      const authClient = createClient(getSupabaseProjectUrl(), publishable, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: authData, error } = await authClient.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && authData.user) {
        return {
          id: admin.id,
          email: admin.email ?? email,
          name: admin.name,
          role: admin.role,
        };
      }
    }
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;

  return {
    id: admin.id,
    email: admin.email ?? admin.loginId,
    name: admin.name,
    role: admin.role,
  };
}
