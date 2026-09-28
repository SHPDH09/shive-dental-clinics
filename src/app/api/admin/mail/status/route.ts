import { requirePermission } from "@/lib/api-auth";
import { resolveSmtpConfig } from "@/lib/mail/smtp-config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;

  const cfg = await resolveSmtpConfig();
  return NextResponse.json({
    configured: Boolean(cfg),
    fromEmail: cfg?.fromEmail ?? null,
    host: cfg?.host ?? null,
  });
}
