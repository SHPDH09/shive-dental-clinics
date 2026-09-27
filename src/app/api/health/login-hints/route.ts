import { isAuthConfigured } from "@/lib/auth-env";
import { isEnvAdminConfigured } from "@/lib/env-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey, isSupabaseConfigured } from "@/lib/supabase/env";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function checkDatabaseOk(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    /* try Supabase REST */
  }

  if (!getSupabaseSecretKey()) return false;

  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from("Admin").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function GET() {
  const dbOk = await checkDatabaseOk();
  const envFallbackOk = isEnvAdminConfigured();
  const supabaseConfigured = isSupabaseConfigured();

  return NextResponse.json({
    authSecretOk: isAuthConfigured(),
    databaseOk: dbOk,
    supabaseConfigured,
    envFallbackOk,
    message: !isAuthConfigured()
      ? "Set AUTH_SECRET in Cloudflare → Workers → Settings → Variables (Encrypt)."
      : dbOk
        ? "OK — sign in with rk331159@gmail.com and your admin password."
        : envFallbackOk
          ? "Database offline — emergency login via ADMIN_PASSWORD still works."
          : "Add Cloudflare encrypted secrets: AUTH_SECRET, ADMIN_PASSWORD, SUPABASE_SECRET_KEY, SUPABASE_DB_PASSWORD.",
  });
}
