import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseProjectUrl, getSupabasePublishableKey } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const key = getSupabasePublishableKey();
  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set");
  }

  const cookieStore = await cookies();

  return createServerClient(getSupabaseProjectUrl(), key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component; ignore if middleware handles refresh.
        }
      },
    },
  });
}
