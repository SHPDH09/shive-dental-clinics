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

  return NextResponse.json({
    authSecretOk: isAuthConfigured(),
    databaseOk: dbOk,
    supabaseConfigured,
    loginVia: "supabase",
    message: !supabaseConfigured
      ? "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
      : !getSupabaseSecretKey()
        ? "Set SUPABASE_SECRET_KEY in Cloudflare (encrypted)."
        : !dbOk
          ? "Admin table missing — run db:push or supabase/seed-admin.sql."
          : !isAuthConfigured()
            ? "Set AUTH_SECRET for admin session cookies (Cloudflare encrypt)."
            : "OK — sign in with email/password from Supabase (Admin table + Auth).",
  });
}
