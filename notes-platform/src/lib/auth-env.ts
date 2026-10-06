export function resolveAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "development") return "dev-only-auth-secret-change-me";
  return "";
}

export function sessionCookieName(): string {
  return process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token";
}
