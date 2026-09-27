import bcrypt from "bcryptjs";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type AdminRow = {
  id: string;
  loginId: string;
  name: string;
  email: string | null;
  passwordHash: string;
  role: string;
};

/** Server-side admin lookup via Supabase (service role). Used when Prisma is unavailable on Workers. */
export async function verifyAdminViaSupabase(loginId: string, password: string) {
  if (!getSupabaseSecretKey()) return null;

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("Admin")
      .select("id, loginId, name, email, passwordHash, role")
      .or(`loginId.eq.${loginId},email.eq.${loginId}`)
      .maybeSingle();

    if (error || !data) return null;
    const admin = data as AdminRow;
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return null;

    return {
      id: admin.id,
      email: admin.email ?? admin.loginId,
      name: admin.name,
      role: admin.role,
    };
  } catch (e) {
    console.error("Supabase admin auth error:", e);
    return null;
  }
}
