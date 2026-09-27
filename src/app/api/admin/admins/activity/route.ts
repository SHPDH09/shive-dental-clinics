import { requireSuperAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { listAdminActivity } from "@/lib/supabase/admins-data";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireSuperAdminSession();
  if (error) return error;

  const limit = Math.min(100, parseInt(new URL(req.url).searchParams.get("limit") || "50", 10));

  try {
    if (canUseSupabaseDataLayer()) {
      const items = await listAdminActivity(limit);
      return NextResponse.json({ items });
    }

    const items = await prisma.adminActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        adminId: true,
        adminName: true,
        action: true,
        entityType: true,
        entityId: true,
        entityLabel: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET activity:", e);
    return NextResponse.json({ items: [] });
  }
}
