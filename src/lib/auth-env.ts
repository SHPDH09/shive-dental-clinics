import { createHash } from "node:crypto";
import { readWorkerEnv } from "@/lib/worker-env";

const BUILD_PLACEHOLDER = "build-time-placeholder-set-auth-secret-in-cloudflare";

/** Same at build and runtime so JWT cookies work on Cloudflare without dashboard secrets. */
export const PRODUCTION_AUTH_SECRET = createHash("sha256")
  .update("https://ojfxtzwzpoosmzotzyxm.supabase.co|shiv-dental-admin-jwt-v4")
  .digest("hex");

function readEnvSecret(): string | undefined {
  const a = readWorkerEnv("AUTH_SECRET");
  const b = readWorkerEnv("NEXTAUTH_SECRET");
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
