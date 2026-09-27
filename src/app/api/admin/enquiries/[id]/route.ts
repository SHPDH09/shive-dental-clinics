import { requireAdminSession } from "@/lib/api-auth";
import { crudById } from "@/lib/crud-route";
import {
  appendAudit,
  parseAuditLog,
  parseConversation,
} from "@/lib/enquiry-helpers";
import { prisma } from "@/lib/prisma";
import { supabaseFindUnique, supabaseUpdate, useSupabaseCrud } from "@/lib/supabase/crud";
import { enquiryAdminPatchSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("enquiry", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = enquiryAdminPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = { ...data };

  if (useSupabaseCrud()) {
    try {
      const row = await supabaseFindUnique("enquiry", id);
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const audit = parseAuditLog(row.auditLog);
      const actions: string[] = [];
      if (data.status) actions.push(`Status → ${data.status}`);
      if (data.assignedStaff !== undefined) actions.push(`Assigned → ${data.assignedStaff ?? "Unassigned"}`);
      if (data.important !== undefined) actions.push(data.important ? "Marked important" : "Unmarked important");
      updateData.auditLog = actions.length
        ? appendAudit(audit, actions.join("; "), data.assignedStaff ?? undefined)
        : audit;
      const item = await supabaseUpdate("enquiry", id, updateData);
      return NextResponse.json(item);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Update failed" }, { status: 503 });
    }
  }

  try {
    const existing = await prisma.enquiry.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const audit = parseAuditLog(existing.auditLog);
    const actions: string[] = [];
    if (data.status) actions.push(`Status → ${data.status}`);
    if (data.assignedStaff !== undefined) actions.push(`Assigned → ${data.assignedStaff ?? "Unassigned"}`);
    if (data.important !== undefined) actions.push(data.important ? "Marked important" : "Unmarked important");

    const item = await prisma.enquiry.update({
      where: { id },
      data: {
        ...data,
        auditLog: actions.length ? appendAudit(audit, actions.join("; ")) : audit,
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("enquiry", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}
