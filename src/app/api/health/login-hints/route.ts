import { isAuthConfigured } from "@/lib/auth-env";
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
    dbOnlyLogin: true,
    message: !isAuthConfigured()
      ? "Set AUTH_SECRET in Cloudflare Variables (Encrypt)."
      : !dbOk
        ? "Database unreachable. Admin login requires AWS RDS — fix DATABASE_URL and RDS connectivity."
        : "OK — sign in with Admin ID or email and password from the Admin table.",
  });
}
