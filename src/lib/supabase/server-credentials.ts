import { readWorkerEnv } from "../worker-env";

function decodeBase64Env(name: string): string | undefined {
  const raw = readWorkerEnv(name)?.trim();
  if (!raw) return undefined;
  try {
    return Buffer.from(raw, "base64").toString("utf8");
  } catch {
    return undefined;
  }
}

/**
 * Service role key for server-side Supabase.
 * Prefer `SUPABASE_SKEY_B64` from wrangler.jsonc (same repo as SUPABASE_URL) so a stale
 * Cloudflare `SUPABASE_SECRET_KEY` secret cannot point at a different project.
 */
export function resolveSupabaseSecretKey(): string | undefined {
  return (
    decodeBase64Env("SUPABASE_SKEY_B64") ||
    readWorkerEnv("SUPABASE_SECRET_KEY") ||
    readWorkerEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

export function resolveSupabaseDbPassword(): string | undefined {
  return readWorkerEnv("SUPABASE_DB_PASSWORD") || decodeBase64Env("SUPABASE_DB_PW_B64");
}
