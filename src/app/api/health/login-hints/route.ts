import { isAuthConfigured } from "@/lib/auth-env";
import { isEnvAdminConfigured } from "@/lib/env-admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const envFallbackOk = isEnvAdminConfigured();
  const supabaseConfigured = isSupabaseConfigured();

  return NextResponse.json({
    authSecretOk: isAuthConfigured(),
    databaseOk: dbOk,
    supabaseConfigured,
    envFallbackOk,
    message: !isAuthConfigured()
      ? "Set AUTH_SECRET in Cloudflare Variables (Encrypt)."
      : dbOk
        ? "OK — sign in with Admin ID or email and password from the Admin table."
        : envFallbackOk
          ? "Database offline — you can still sign in with ADMIN_LOGIN_ID / ADMIN_EMAIL and ADMIN_PASSWORD from Cloudflare secrets."
          : "Database unreachable. Set DATABASE_URL or configure ADMIN_LOGIN_ID + ADMIN_PASSWORD in Cloudflare.",
  });
}
