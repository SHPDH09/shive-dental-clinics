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

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: { role?: string; name?: string };
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

/** Edge-friendly Supabase password grant (works on Cloudflare Workers). */
async function supabasePasswordSignIn(
  email: string,
  password: string,
): Promise<SupabaseAuthUser | null> {
  const apikey = getSupabasePublishableKey();
  if (!apikey) return null;

  const url = `${getSupabaseProjectUrl()}/auth/v1/token?grant_type=password`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey,
        Authorization: `Bearer ${apikey}`,
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { user?: SupabaseAuthUser };
    return json.user ?? null;
  } catch {
    return null;
  }
}

async function supabaseJsPasswordSignIn(
  email: string,
  password: string,
): Promise<SupabaseAuthUser | null> {
  const publishable = getSupabasePublishableKey();
  if (!publishable) return null;
  try {
    const authClient = createClient(getSupabaseProjectUrl(), publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    if (error || !data.user) return null;
    return data.user as SupabaseAuthUser;
  } catch {
    return null;
  }
}

function sessionUserFromAuth(
  authUser: SupabaseAuthUser,
  admin: AdminRow | null,
  email: string,
) {
  const meta = authUser.user_metadata ?? {};
  return {
    id: admin?.id ?? authUser.id,
    email,
    name: admin?.name ?? meta.name ?? "Shiv Dental Admin",
    role: admin?.role ?? meta.role ?? "SUPER_ADMIN",
  };
}

/** Supabase Auth (email) + optional Admin table password hash. */
export async function authenticateAdmin(loginId: string, password: string) {
  const trimmed = loginId.trim();
  const admin = await findAdminRow(trimmed);
  const email = admin?.email ?? (trimmed.includes("@") ? trimmed : null);

  if (email) {
    const authUser =
      (await supabasePasswordSignIn(email, password)) ??
      (await supabaseJsPasswordSignIn(email, password));
    if (authUser) {
      return sessionUserFromAuth(authUser, admin, email);
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
