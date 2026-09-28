import { requirePermission } from "@/lib/api-auth";
import { listMailboxMessages, type MailFolder } from "@/lib/mail/mail-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const folder = (searchParams.get("folder") || "inbox") as MailFolder;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "30", 10));
  const q = searchParams.get("q") ?? undefined;

  try {
    const result = await listMailboxMessages({ folder, page, limit, q });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load mail" }, { status: 503 });
  }
}
