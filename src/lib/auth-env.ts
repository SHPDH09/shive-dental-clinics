const BUILD_PLACEHOLDER = "build-time-placeholder-set-auth-secret-in-cloudflare";

function readEnvSecret(): string | undefined {
  const a = process.env.AUTH_SECRET?.trim();
  const b = process.env.NEXTAUTH_SECRET?.trim();
  if (a && a !== BUILD_PLACEHOLDER) return a;
  if (b && b !== BUILD_PLACEHOLDER) return b;
  return undefined;
}

/** Resolve AUTH_SECRET (Cloudflare Workers injects dashboard Variables into process.env). */
export function resolveAuthSecret(): string {
  const fromEnv = readEnvSecret();
  if (fromEnv) return fromEnv;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare") as {
      getCloudflareContext: () => { env?: Record<string, string> };
    };
    const bound = getCloudflareContext()?.env?.AUTH_SECRET?.trim();
    if (bound && bound !== BUILD_PLACEHOLDER) return bound;
  } catch {
    // Not running on Cloudflare / outside request
  }

  if (process.env.NODE_ENV === "development") {
    return "dev-only-auth-secret-change-me";
  }

  return "";
}

export function isAuthConfigured(): boolean {
  return resolveAuthSecret().length > 0;
}

export function getAuthUrl(): string | undefined {
  const url =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  return url || undefined;
}
