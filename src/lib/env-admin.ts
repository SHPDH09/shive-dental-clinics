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

/**
 * Break-glass login when the database is down.
 * Production requires ENABLE_ENV_ADMIN_LOGIN=1 plus ADMIN_LOGIN_ID + ADMIN_PASSWORD (encrypted secrets).
 */
export function verifyEnvAdmin(loginId: string, password: string) {
  if (process.env.NODE_ENV === "production" && readWorkerEnv("ENABLE_ENV_ADMIN_LOGIN") !== "1") {
    return null;
  }

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
