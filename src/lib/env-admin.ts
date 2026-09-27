import { timingSafeEqual } from "node:crypto";
import { readWorkerEnv } from "@/lib/worker-env";

export function isEnvAdminConfigured(): boolean {
  return Boolean(readWorkerEnv("ADMIN_LOGIN_ID") && readWorkerEnv("ADMIN_PASSWORD"));
}

function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
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
