import { readWorkerEnv } from "../worker-env";

const DEFAULT_PROJECT_URL = "https://ojfxtzwzpoosmzotzyxm.supabase.co";

export function getSupabaseProjectUrl(): string {
  return (
    readWorkerEnv("SUPABASE_URL") ||
    readWorkerEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    DEFAULT_PROJECT_URL
  );
}

export function getSupabasePublishableKey(): string | undefined {
  return (
    readWorkerEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
    readWorkerEnv("SUPABASE_PUBLISHABLE_KEY") ||
    readWorkerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

/** Server-only — bypasses RLS. Set in Cloudflare secrets, never expose to client. */
export function getSupabaseSecretKey(): string | undefined {
  return readWorkerEnv("SUPABASE_SECRET_KEY") || readWorkerEnv("SUPABASE_SERVICE_ROLE_KEY");
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
