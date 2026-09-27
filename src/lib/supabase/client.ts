"use client";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseProjectUrl, getSupabasePublishableKey } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createClient> | null = null;

export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = getSupabaseProjectUrl();
  const key = getSupabasePublishableKey();
  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set");
  }

  browserClient = createClient(url, key);
  return browserClient;
}
