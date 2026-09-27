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

/** Worker secrets first; optional base64 vars for deploy when encrypted secrets are not set. */
export function resolveSupabaseSecretKey(): string | undefined {
  return (
    readWorkerEnv("SUPABASE_SECRET_KEY") ||
    readWorkerEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    decodeBase64Env("SUPABASE_SKEY_B64")
  );
}

export function resolveSupabaseDbPassword(): string | undefined {
  return readWorkerEnv("SUPABASE_DB_PASSWORD") || decodeBase64Env("SUPABASE_DB_PW_B64");
}
