import { createHash } from "node:crypto";
import { readWorkerEnv } from "@/lib/worker-env";
import { getSupabaseProjectUrl, getSupabasePublishableKey } from "@/lib/supabase/env";

const BUILD_PLACEHOLDER = "build-time-placeholder-set-auth-secret-in-cloudflare";

function readEnvSecret(): string | undefined {
  const a = readWorkerEnv("AUTH_SECRET");
  const b = readWorkerEnv("NEXTAUTH_SECRET");
  if (a && a !== BUILD_PLACEHOLDER) return a;
  if (b && b !== BUILD_PLACEHOLDER) return b;
  return undefined;
}

/** Stable JWT secret when dashboard secret is missing (still set AUTH_SECRET in production). */
function productionFallbackSecret(): string | undefined {
  const pub = getSupabasePublishableKey();
  if (!pub) return undefined;
  const digest = createHash("sha256")
    .update(`${getSupabaseProjectUrl()}|${pub}|shiv-dental-admin-jwt`)
    .digest("hex");
  return digest;
}

/** Resolve AUTH_SECRET (Cloudflare Workers injects dashboard Variables into process.env). */
export function resolveAuthSecret(): string {
  const fromEnv = readEnvSecret();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "development") {
    return "dev-only-auth-secret-change-me";
  }

  return productionFallbackSecret() ?? "";
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
