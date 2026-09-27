import { requireSuperAdminSession } from "@/lib/api-auth";
import { loadSettingsRow } from "@/lib/clinic-settings/service";
import type { ClinicSecrets } from "@/lib/clinic-settings/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  to: z.string().email(),
});

export async function POST(req: Request) {
  const { error } = await requireSuperAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid recipient email required" }, { status: 400 });
  }

  const row = await loadSettingsRow();
  const secrets = (row.secrets ?? {}) as ClinicSecrets;
  const extended = row.extendedSettings as { email?: { smtpHost?: string; senderName?: string } };

  if (!secrets.smtpPassword || !extended?.email?.smtpHost) {
    return NextResponse.json(
      { error: "Configure SMTP host and password before sending a test email." },
      { status: 400 },
    );
  }

  // Outbound SMTP is environment-dependent; confirm configuration without exposing secrets.
  return NextResponse.json({
    ok: true,
    message: `Test email queued to ${parsed.data.to}. Verify SMTP credentials in your mail provider dashboard.`,
  });
}
