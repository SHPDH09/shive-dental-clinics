import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseProjectUrl,
  getSupabasePublishableKey,
  getSupabaseSecretKey,
} from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { writeAdminAudit } from "@/lib/admin-audit";
import { isLocked, recordLoginFailure, recordLoginSuccess } from "@/lib/admin-login-state";
import { verifyEnvAdmin } from "@/lib/env-admin";

type AdminRow = {
  id: string;
  loginId: string;
  name: string;
  email: string | null;
  passwordHash: string;
  role: string;
  active?: boolean;
  loginAttempts?: number;
  lockedUntil?: string | null;
};

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: { role?: string; name?: string };
};

export type AdminAuthResult = {
  id: string;
  email: string;
  name: string;
  role: string;
  accessToken?: string;
};

async function findAdminRow(loginId: string): Promise<AdminRow | null> {
  if (!getSupabaseSecretKey()) return null;
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("Admin")
      .select("id, loginId, name, email, passwordHash, role, active, loginAttempts, lockedUntil")
      .or(`loginId.eq.${loginId},email.eq.${loginId}`)
      .maybeSingle();
    if (error || !data) return null;
    return data as AdminRow;
  } catch {
    return null;
  }
}

async function supabasePasswordSignIn(
  email: string,
  password: string,
): Promise<{ user: SupabaseAuthUser; accessToken: string } | null> {
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
    const json = (await res.json()) as {
      access_token?: string;
      user?: SupabaseAuthUser;
    };
    if (!json.access_token || !json.user) return null;
    return { user: json.user, accessToken: json.access_token };
  } catch {
    return null;
  }
}

async function supabaseJsPasswordSignIn(
  email: string,
  password: string,
): Promise<{ user: SupabaseAuthUser; accessToken: string } | null> {
  const publishable = getSupabasePublishableKey();
  if (!publishable) return null;
  try {
    const authClient = createClient(getSupabaseProjectUrl(), publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session?.access_token) return null;
    return { user: data.user as SupabaseAuthUser, accessToken: data.session.access_token };
  } catch {
    return null;
  }
}

function sessionUserFromAuth(
  authUser: SupabaseAuthUser,
  admin: AdminRow,
  email: string,
  accessToken?: string,
): AdminAuthResult {
  return {
    id: admin.id,
    email: admin.email ?? email,
    name: admin.name,
    role: admin.role,
    accessToken,
  };
}

/** Supabase Auth (email) + optional Admin table password hash + emergency env fallback. */
export async function authenticateAdmin(loginId: string, password: string): Promise<AdminAuthResult | null> {
  const trimmed = loginId.trim();
  const admin = await findAdminRow(trimmed);
  const email = admin?.email ?? (trimmed.includes("@") ? trimmed : null);

  // Try Supabase Auth
  if (email) {
    const auth =
      (await supabasePasswordSignIn(email, password)) ??
      (await supabaseJsPasswordSignIn(email, password));
    if (auth) {
      let linked = admin;
      if (!linked && email) {
        linked = await findAdminRow(email);
      }
      if (!linked?.id) {
        return null;
      }
      if (linked.active === false) {
        return null;
      }
      await recordLoginSuccess(linked.id);
      void writeAdminAudit({
        adminId: linked.id,
        adminName: linked.name,
        action: "LOGIN",
        entityType: "session",
      });
      return sessionUserFromAuth(auth.user, linked, email, auth.accessToken);
    }
  }

  // Try Admin table password hash
  if (admin) {
    if (admin.active === false) {
      return null;
    }
    if (isLocked(admin.lockedUntil ? new Date(admin.lockedUntil) : null)) {
      return null;
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (valid) {
      await recordLoginSuccess(admin.id);
      void writeAdminAudit({
        adminId: admin.id,
        adminName: admin.name,
        action: "LOGIN",
        entityType: "session",
      });
      return {
        id: admin.id,
        email: admin.email ?? admin.loginId,
        name: admin.name,
        role: admin.role,
      };
    }
    await recordLoginFailure(admin.id);
  }

  // Emergency fallback: environment variables
  const envAdmin = verifyEnvAdmin(loginId, password);
  if (envAdmin) {
    return envAdmin;
  }

  return null;
}
