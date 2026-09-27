import { readWorkerEnv } from "../worker-env";

/**
 * Server-only Supabase credentials from Worker secrets or process env.
 * Set SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) and SUPABASE_DB_PASSWORD
 * in the Cloudflare dashboard — never commit secret values to the repo.
 */
export function resolveSupabaseSecretKey(): string | undefined {
  return (
    readWorkerEnv("SUPABASE_SECRET_KEY") ||
    readWorkerEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

export function resolveSupabaseDbPassword(): string | undefined {
  return readWorkerEnv("SUPABASE_DB_PASSWORD");
}
