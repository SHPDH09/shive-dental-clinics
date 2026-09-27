const BUILD_PLACEHOLDER = "build-time-placeholder-set-auth-secret-in-cloudflare";

/** Auth.js requires AUTH_SECRET in production (Cloudflare → Settings → Variables). */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret && secret !== BUILD_PLACEHOLDER) return secret;
  if (process.env.NODE_ENV === "development") {
    return "dev-only-auth-secret-change-me";
  }
  return "";
}

export function isAuthConfigured(): boolean {
  return getAuthSecret().length > 0;
}

export function getAuthUrl(): string | undefined {
  const url =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  return url || undefined;
}
