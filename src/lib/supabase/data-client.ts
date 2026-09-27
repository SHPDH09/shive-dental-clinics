import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseProjectUrl, getSupabasePublishableKey, getSupabaseSecretKey } from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const SUPABASE_ACCESS_COOKIE = "sb-access-token";

/** Service role when configured; otherwise the logged-in admin's Supabase JWT from login. */
export async function getAdminSupabaseClient(): Promise<SupabaseClient> {
  const serviceKey = getSupabaseSecretKey();
  if (serviceKey) {
    return createSupabaseServiceClient();
  }

  const publishable = getSupabasePublishableKey();
  if (!publishable) {
    throw new Error("Supabase is not configured");
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SUPABASE_ACCESS_COOKIE)?.value;
  if (!accessToken) {
    throw new Error("Admin database session missing — sign in again");
  }

  return createClient(getSupabaseProjectUrl(), publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function canUseSupabaseDataLayer(): boolean {
  return Boolean(getSupabaseSecretKey() || getSupabasePublishableKey());
}

/** Prefer service role (bypasses RLS); fall back to admin JWT session. */
export async function getAdminWriteSupabaseClient(): Promise<SupabaseClient> {
  const serviceKey = getSupabaseSecretKey();
  if (serviceKey) {
    return createSupabaseServiceClient();
  }
  return getAdminSupabaseClient();
}
