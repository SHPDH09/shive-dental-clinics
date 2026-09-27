const DEFAULT_PROJECT_URL = "https://ojfxtzwzpoosmzotzyxm.supabase.co";

export function getSupabaseProjectUrl(): string {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    DEFAULT_PROJECT_URL
  );
}

export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

/** Server-only — bypasses RLS. Set in Cloudflare secrets, never expose to client. */
export function getSupabaseSecretKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseProjectUrl() && getSupabasePublishableKey());
}

export function getSupabaseProjectRef(): string {
  try {
    const host = new URL(getSupabaseProjectUrl()).hostname;
    return host.split(".")[0] ?? "ojfxtzwzpoosmzotzyxm";
  } catch {
    return "ojfxtzwzpoosmzotzyxm";
  }
}
