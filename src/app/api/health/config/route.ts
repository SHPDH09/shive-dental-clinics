import { healthGuard } from "@/lib/health-guard";
import { isAuthConfigured } from "@/lib/auth-env";
import { resolveDatabaseUrl } from "@/lib/database-url";
import { getAuthUrl } from "@/lib/auth-env";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const blocked = healthGuard(req);
  if (blocked) return blocked;

  const hasDatabase = Boolean(resolveDatabaseUrl());
  const hasAuth = isAuthConfigured();
  const hasAuthUrl = Boolean(getAuthUrl());

  return NextResponse.json({
    ok: hasDatabase && hasAuth,
    databaseUrlConfigured: hasDatabase,
    authSecretConfigured: hasAuth,
    authUrlConfigured: hasAuthUrl,
    hint: !hasAuth
      ? "Set AUTH_SECRET in Cloudflare Variables (Encrypt)."
      : !hasDatabase
        ? "Set SUPABASE_DB_PASSWORD or DATABASE_URL in Cloudflare secrets."
        : "Configuration looks present; check /api/health/login-hints",
  });
}
