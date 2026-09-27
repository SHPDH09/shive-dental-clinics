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
  const dbOk = await checkDatabaseOk();
  const supabaseConfigured = isSupabaseConfigured();
  const canLogin =
    supabaseConfigured && isAuthConfigured() && (dbOk || Boolean(getSupabaseSecretKey()));

  return NextResponse.json({
    authSecretOk: isAuthConfigured(),
    databaseOk: dbOk,
    supabaseConfigured,
    loginVia: "supabase",
    canLogin,
    message: !supabaseConfigured
      ? "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
      : !isAuthConfigured()
        ? "Set AUTH_SECRET in Cloudflare (Encrypt) for admin session."
        : !getSupabaseSecretKey()
          ? "Set SUPABASE_SECRET_KEY in Cloudflare (Encrypt) for data save/delete."
          : !dbOk
            ? "Run db:push or seed Admin table in Supabase."
            : "OK — Supabase login and database ready.",
  });
}
