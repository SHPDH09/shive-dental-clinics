import { isAuthConfigured } from "@/lib/auth-env";
import { isEnvAdminConfigured } from "@/lib/env-admin";
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

  return NextResponse.json({
    authSecretOk: isAuthConfigured(),
    databaseOk: dbOk,
    envAdminFallback: isEnvAdminConfigured(),
    message: !isAuthConfigured()
      ? "Set AUTH_SECRET in Cloudflare Variables (Encrypt)."
      : !dbOk && !isEnvAdminConfigured()
        ? "Database unreachable. Set DATABASE_URL and ADMIN_PASSWORD (encrypted) + ADMIN_LOGIN_ID for emergency login."
        : !dbOk && isEnvAdminConfigured()
          ? "Database unreachable — you can sign in with ADMIN_LOGIN_ID / ADMIN_PASSWORD from Cloudflare secrets."
          : "OK",
  });
}
