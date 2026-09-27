import { createClient } from "@supabase/supabase-js";
import { getSupabaseProjectUrl, getSupabaseSecretKey } from "@/lib/supabase/env";

/** Elevated server client (bypasses RLS). Requires SUPABASE_SECRET_KEY. */
export function createSupabaseServiceClient() {
  const secret = getSupabaseSecretKey();
  if (!secret) {
    throw new Error("SUPABASE_SECRET_KEY is not set");
  }
  return createClient(getSupabaseProjectUrl(), secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
