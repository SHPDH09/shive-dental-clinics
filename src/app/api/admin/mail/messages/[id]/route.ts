import { requirePermission } from "@/lib/api-auth";
import { getMailboxMessage, updateMailboxMessage } from "@/lib/mail/mail-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;
  const { id } = await context.params;
  const row = await getMailboxMessage(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requirePermission("messages", "edit");
  if (error) return error;
  const { id } = await context.params;
  const body = (await req.json()) as { read?: boolean; starred?: boolean; folder?: "inbox" | "sent" | "trash" };
  const updated = await updateMailboxMessage(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { error } = await requirePermission("messages", "delete");
  if (error) return error;
  const { id } = await context.params;
  const updated = await updateMailboxMessage(id, { folder: "trash" });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
