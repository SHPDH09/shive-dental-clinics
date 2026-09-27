import { healthGuard } from "@/lib/health-guard";
import { isAuthConfigured } from "@/lib/auth-env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey, isSupabaseConfigured } from "@/lib/supabase/env";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function checkDatabaseOk(): Promise<boolean> {
  if (!getSupabaseSecretKey()) return false;
  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from("Admin").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const blocked = healthGuard(req);
  if (blocked) return blocked;

  const supabaseConfigured = isSupabaseConfigured();
  const authSecretOk = isAuthConfigured();
  const databaseOk = await checkDatabaseOk();
  const canLogin = supabaseConfigured && authSecretOk;

  return NextResponse.json({
    authSecretOk,
    databaseOk,
    supabaseConfigured,
    loginVia: "supabase",
    canLogin,
    message: !supabaseConfigured
      ? "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
      : !authSecretOk
        ? "Session signing unavailable — contact support."
        : !databaseOk
          ? "Admin database is not reachable from this environment."
          : "Configuration OK — use your assigned admin email and password.",
  });
}
