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

export async function GET() {
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
          ? "Login uses Supabase Auth; add SUPABASE_SECRET_KEY for full admin CRUD."
          : "OK — sign in with rk331159@gmail.com and your Supabase password.",
  });
}
