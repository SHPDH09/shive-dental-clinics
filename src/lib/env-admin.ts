import { timingSafeEqual } from "node:crypto";

export function isEnvAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_LOGIN_ID?.trim() && process.env.ADMIN_PASSWORD?.trim());
}

function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Fallback login when the database is down — set ADMIN_LOGIN_ID + ADMIN_PASSWORD in Cloudflare (encrypted). */
export function verifyEnvAdmin(loginId: string, password: string) {
  const envId = process.env.ADMIN_LOGIN_ID?.trim();
  const envEmail = process.env.ADMIN_EMAIL?.trim();
  const envPass = process.env.ADMIN_PASSWORD?.trim();
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
