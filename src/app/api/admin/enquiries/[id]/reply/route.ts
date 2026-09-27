import { createId } from "@paralleldrive/cuid2";
import { requireAdminSession } from "@/lib/api-auth";
import {
  appendAudit,
  parseAuditLog,
  parseConversation,
} from "@/lib/enquiry-helpers";
import { prisma } from "@/lib/prisma";
import { supabaseUpdate, useSupabaseCrud } from "@/lib/supabase/crud";
import { enquiryReplySchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = enquiryReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reply = {
    id: createId(),
    direction: "out" as const,
    subject: parsed.data.subject,
    body: parsed.data.message,
    sentAt: new Date().toISOString(),
    sentBy: parsed.data.sentBy ?? "Admin",
  };

  if (useSupabaseCrud()) {
    try {
      const { supabaseFindUnique } = await import("@/lib/supabase/crud");
      const row = await supabaseFindUnique("enquiry", id);
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const conversation = [...parseConversation(row.conversation), reply];
      const audit = appendAudit(parseAuditLog(row.auditLog), "Reply sent", reply.sentBy);
      const item = await supabaseUpdate("enquiry", id, {
        conversation,
        auditLog: audit,
        status: "REPLIED",
      });
      return NextResponse.json(item);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Failed to send reply" }, { status: 503 });
    }
  }

  try {
    const existing = await prisma.enquiry.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const conversation = [...parseConversation(existing.conversation), reply];
    const audit = appendAudit(parseAuditLog(existing.auditLog), "Reply sent", reply.sentBy);
    const item = await prisma.enquiry.update({
      where: { id },
      data: {
        conversation,
        auditLog: audit,
        status: "REPLIED",
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 400 });
  }
}
