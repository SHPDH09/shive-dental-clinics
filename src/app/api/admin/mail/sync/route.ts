import { requirePermission } from "@/lib/api-auth";
import { syncInboxFromGmail } from "@/lib/mail/imap-sync";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const { error } = await requirePermission("messages", "edit");
  if (error) return error;

  const result = await syncInboxFromGmail(50);
  if (result.error) {
    return NextResponse.json({ error: result.error, synced: 0 }, { status: 502 });
  }
  return NextResponse.json({ ok: true, synced: result.synced });
}
