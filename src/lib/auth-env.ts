import { readWorkerEnvPlainOrB64 } from "@/lib/env-b64";
import { readWorkerEnv } from "@/lib/worker-env";

const BUILD_PLACEHOLDER = "build-time-placeholder-set-auth-secret-in-cloudflare";

/** Precomputed sha256(supabase project url + salt) — edge-safe (no node:crypto). */
export const PRODUCTION_AUTH_SECRET =
  "4bcc5249f10b987ba024c609fdad337d5fff96292712528bcdd6372a56224da5";

function readEnvSecret(): string | undefined {
  const a = readWorkerEnvPlainOrB64("AUTH_SECRET");
  const b = readWorkerEnvPlainOrB64("NEXTAUTH_SECRET");
  if (a && a !== BUILD_PLACEHOLDER) return a;
  if (b && b !== BUILD_PLACEHOLDER) return b;
  return undefined;
}

export function resolveAuthSecret(): string {
  const fromEnv = readEnvSecret();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "development") {
    return "dev-only-auth-secret-change-me";
  }

  return PRODUCTION_AUTH_SECRET;
}

/** True when a strong random AUTH_SECRET is configured (recommended for production). */
export function isStrongAuthSecretConfigured(): boolean {
  const s = readEnvSecret();
  return Boolean(s && s.length >= 32 && s !== PRODUCTION_AUTH_SECRET);
}

export function isAuthConfigured(): boolean {
  return resolveAuthSecret().length > 0;
}

export function getAuthUrl(): string | undefined {
  const url =
    readWorkerEnv("AUTH_URL") ||
    readWorkerEnv("NEXTAUTH_URL") ||
    readWorkerEnv("NEXT_PUBLIC_APP_URL");
  return url || undefined;
}

export function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}
