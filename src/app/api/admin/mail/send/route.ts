import { requirePermission } from "@/lib/api-auth";
import { sendMail } from "@/lib/mail/send-mail";
import { createNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  cc: z.string().email().optional(),
});

export async function POST(req: Request) {
  const { error } = await requirePermission("messages", "create");
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email form" }, { status: 400 });
  }

  const result = await sendMail({
    to: parsed.data.to,
    cc: parsed.data.cc ? [parsed.data.cc] : undefined,
    subject: parsed.data.subject,
    text: parsed.data.body,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  try {
    await createNotification({
      type: "NEW_ENQUIRY",
      title: "Email sent",
      message: `To ${parsed.data.to}: ${parsed.data.subject}`,
      link: "/admin/communications",
    });
  } catch {
    /* non-blocking */
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
