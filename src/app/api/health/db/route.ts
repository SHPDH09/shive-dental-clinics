import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import { prisma } from "@/lib/prisma";
import { resolveDatabaseUrl } from "@/lib/database-url";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const host = resolveDatabaseUrl()?.replace(/:[^:@/]+@/, ":****@") ?? "configured";
    return NextResponse.json({
      connected: true,
      message: "Successfully connected to PostgreSQL",
      databaseHost: host.split("@")[1]?.split("/")[0] ?? "unknown",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (getSupabaseSecretKey()) {
      try {
        const supabase = createSupabaseServiceClient();
        const { error: sbError } = await supabase.from("Admin").select("id").limit(1);
        if (!sbError) {
          return NextResponse.json({
            connected: true,
            message: "Connected via Supabase API (Workers-safe)",
            databaseHost: "supabase.co",
          });
        }
      } catch {
        /* fall through */
      }
    }

    return NextResponse.json(
      {
        connected: false,
        message: "Database connection failed",
        error: message,
      },
      { status: 503 },
    );
  }
}
