import { createId } from "@paralleldrive/cuid2";
import { requireAdminSession } from "@/lib/api-auth";
import {
  appendAudit,
  parseAuditLog,
  parseConversation,
} from "@/lib/enquiry-helpers";
import { isValidReplyEmail, sendEnquiryReplyEmail } from "@/lib/mail/enquiry-reply-mail";
import { prisma } from "@/lib/prisma";
import { supabaseUpdate, useSupabaseCrud } from "@/lib/supabase/crud";
import { enquiryReplySchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

type EnquiryRow = {
  id: string;
  name: string;
  email: string | null;
  subject?: string;
  conversation: unknown;
  auditLog: unknown;
};

async function persistReply(row: EnquiryRow, reply: {
  id: string;
  direction: "out";
  subject: string;
  body: string;
  sentAt: string;
  sentBy: string;
}) {
  const conversation = [...parseConversation(row.conversation), reply];
  const audit = appendAudit(parseAuditLog(row.auditLog), "Reply sent", reply.sentBy);

  if (useSupabaseCrud()) {
    const item = await supabaseUpdate("enquiry", row.id, {
      conversation,
      auditLog: audit,
      status: "REPLIED",
    });
    return item;
  }

  return prisma.enquiry.update({
    where: { id: row.id },
    data: {
      conversation,
      auditLog: audit,
      status: "REPLIED",
    },
  });
}

export async function POST(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = enquiryReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let row: EnquiryRow | null = null;

  if (useSupabaseCrud()) {
    try {
      const { supabaseFindUnique } = await import("@/lib/supabase/crud");
      const found = await supabaseFindUnique("enquiry", id);
      if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
      row = found as EnquiryRow;
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Failed to load enquiry" }, { status: 503 });
    }
  } else {
    try {
      const found = await prisma.enquiry.findUnique({ where: { id } });
      if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
      row = found;
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Failed to load enquiry" }, { status: 503 });
    }
  }

  if (!isValidReplyEmail(row.email)) {
    return NextResponse.json(
      {
        error:
          "This message has no valid patient email. Use the WhatsApp or phone buttons to reply, or ask the patient for an email address.",
      },
      { status: 400 },
    );
  }

  const baseSubject = parsed.data.subject.trim() || row.subject?.trim() || "Your enquiry";
  const subject = baseSubject.startsWith("Re:") ? baseSubject : `Re: ${baseSubject}`;

  const mailResult = await sendEnquiryReplyEmail({
    to: row.email!,
    patientName: row.name,
    subject,
    message: parsed.data.message,
  });

  if (!mailResult.ok) {
    return NextResponse.json(
      { error: mailResult.error || "Email could not be sent. Check SMTP settings on the server." },
      { status: 502 },
    );
  }

  const reply = {
    id: createId(),
    direction: "out" as const,
    subject,
    body: parsed.data.message,
    sentAt: new Date().toISOString(),
    sentBy: parsed.data.sentBy ?? "Admin",
    emailMessageId: mailResult.messageId,
  };

  try {
    const item = await persistReply(row, reply);
    return NextResponse.json({ ...item, emailSent: true, emailTo: row.email });
  } catch (e) {
    console.error("Reply saved after email — DB update failed:", e);
    return NextResponse.json(
      {
        error: "Email was sent but saving the reply in the inbox failed. Refresh and check the conversation.",
        emailSent: true,
      },
      { status: 503 },
    );
  }
}
