import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer, getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { supabaseCreate } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const readParam = searchParams.get("read");

  try {
    if (canUseSupabaseDataLayer()) {
      const sb = await getAdminSupabaseClient();
      let query = sb.from("Notification").select("*", { count: "exact" });
      if (readParam === "true" || readParam === "1") query = query.eq("read", true);
      if (readParam === "false" || readParam === "0") query = query.eq("read", false);
      const { data, error: listError, count } = await query
        .order("createdAt", { ascending: false })
        .range(from, to);
      if (listError) throw listError;
      return NextResponse.json({ items: data ?? [], total: count ?? 0, page, limit });
    }

    const skip = (page - 1) * limit;
    const where =
      readParam === "true" || readParam === "1"
        ? { read: true }
        : readParam === "false" || readParam === "0"
          ? { read: false }
          : {};

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error("GET /api/admin/notifications:", e);
    return NextResponse.json({ items: [], total: 0, page, limit });
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const data = await req.json();

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseCreate("notification", data);
      return NextResponse.json(item);
    }

    const item = await prisma.notification.create({ data });
    return NextResponse.json(item);
  } catch (e) {
    console.error("POST /api/admin/notifications:", e);
    return NextResponse.json({ error: "Could not create notification" }, { status: 500 });
  }
}
