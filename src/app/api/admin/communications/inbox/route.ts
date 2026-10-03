import { requirePermission } from "@/lib/api-auth";
import { buildUnifiedInbox } from "@/lib/communications/inbox";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;

  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "50");
  const items = await buildUnifiedInbox(Math.min(limit, 100));
  return NextResponse.json({ items });
}
