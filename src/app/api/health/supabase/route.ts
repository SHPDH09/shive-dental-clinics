import { healthGuard } from "@/lib/health-guard";
import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseProjectUrl,
  getSupabasePublishableKey,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const blocked = healthGuard(req);
  if (blocked) return blocked;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      ok: false,
      message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    });
  }

  const url = getSupabaseProjectUrl();
  const key = getSupabasePublishableKey()!;

  try {
    const supabase = createClient(url, key);
    const { error } = await supabase.from("Admin").select("id").limit(1);
    if (error) {
      return NextResponse.json({
        configured: true,
        ok: false,
        message: error.message,
        hint:
          error.code === "PGRST205"
            ? "Run npm run db:push (with DATABASE_URL or SUPABASE_DB_PASSWORD) to create tables."
            : undefined,
      });
    }
    return NextResponse.json({
      configured: true,
      ok: true,
      message: "Supabase API reachable",
      projectUrl: url,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ configured: true, ok: false, message }, { status: 503 });
  }
}
