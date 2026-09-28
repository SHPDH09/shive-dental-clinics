import { requirePermission } from "@/lib/api-auth";
import { sendMail } from "@/lib/mail/send-mail";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  to: z.string().email(),
});

export async function POST(req: Request) {
  const { error } = await requirePermission("settings", "edit");
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid recipient email required" }, { status: 400 });
  }

  const result = await sendMail({
    to: parsed.data.to,
    subject: "Shiv Dental Clinic — SMTP test",
    text: "This is a test email from Shiv Dental Clinic admin. SMTP is working correctly.",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    message: `Test email sent to ${parsed.data.to}.`,
  });
}
