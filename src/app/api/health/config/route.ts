import { isAuthConfigured } from "@/lib/auth-env";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const hasAuth = isAuthConfigured();
  const hasAuthUrl = Boolean(
    process.env.AUTH_URL?.trim() ||
      process.env.NEXTAUTH_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim(),
  );

  return NextResponse.json({
    ok: hasDatabaseUrl && hasAuth,
    databaseUrlConfigured: hasDatabaseUrl,
    authSecretConfigured: hasAuth,
    authUrlConfigured: hasAuthUrl,
    hint: !hasAuth
      ? "Set AUTH_SECRET in Cloudflare Variables (Production + Preview)"
      : !hasDatabaseUrl
        ? "Set DATABASE_URL to your AWS RDS PostgreSQL URL"
        : "Configuration looks present; check /api/health/db for DB connectivity",
  });
}
