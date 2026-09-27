import { readWorkerEnv } from "@/lib/worker-env";

export function isEnvAdminConfigured(): boolean {
  return Boolean(readWorkerEnv("ADMIN_LOGIN_ID") && readWorkerEnv("ADMIN_PASSWORD"));
}

function safeEqualString(a: string, b: string): boolean {
  // Simple constant-time string comparison without node:crypto
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Fallback login when the database is down — set ADMIN_LOGIN_ID + ADMIN_PASSWORD in Cloudflare (encrypted). */
export function verifyEnvAdmin(loginId: string, password: string) {
  const envId = readWorkerEnv("ADMIN_LOGIN_ID");
  const envEmail = readWorkerEnv("ADMIN_EMAIL");
  const envPass = readWorkerEnv("ADMIN_PASSWORD");
  if (!envId || !envPass) return null;

  const login = loginId.trim();
  const idOk =
    safeEqualString(login, envId) || (envEmail ? safeEqualString(login, envEmail) : false);
  if (!idOk) return null;
  if (!safeEqualString(password, envPass)) return null;

  return {
    id: "env-bootstrap-admin",
    email: envEmail ?? envId,
    name: "Shiv Dental Admin",
    role: "SUPER_ADMIN" as const,
  };
}
