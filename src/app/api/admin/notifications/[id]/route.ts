import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseCrudById } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  if (canUseSupabaseDataLayer()) {
    const result = await supabaseCrudById(
      "notification",
      new Request(_req.url, { method: "GET" }),
      id,
    );
    if (result.error) return result.error;
    return NextResponse.json(result.data);
  }

  const item = await prisma.notification.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = (await req.json()) as { read?: boolean };
  const read = body.read !== undefined ? body.read : true;

  if (canUseSupabaseDataLayer()) {
    const result = await supabaseCrudById(
      "notification",
      new Request(req.url, {
        method: "PATCH",
        headers: req.headers,
        body: JSON.stringify({ read }),
      }),
      id,
    );
    if (result.error) return result.error;
    return NextResponse.json(result.data);
  }

  try {
    const item = await prisma.notification.update({
      where: { id },
      data: { read },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  if (canUseSupabaseDataLayer()) {
    const result = await supabaseCrudById(
      "notification",
      new Request(_req.url, { method: "DELETE" }),
      id,
    );
    if (result.error) return result.error;
    return NextResponse.json(result.data);
  }

  try {
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
