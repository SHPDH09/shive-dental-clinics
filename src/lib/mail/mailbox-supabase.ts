import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";

/** PostgREST errors when `"MailboxMessage"` has not been migrated yet. */
export function isMailboxTableMissingMessage(message: string): boolean {
  return /Could not find the table|does not exist|PGRST205|schema cache/i.test(message);
}

export async function getMailboxSupabaseClient(): Promise<SupabaseClient | null> {
  try {
    if (getSupabaseSecretKey()) {
      return createSupabaseServiceClient();
    }
    return await getAdminSupabaseClient();
  } catch (e) {
    console.warn("getMailboxSupabaseClient:", e);
    return null;
  }
}
