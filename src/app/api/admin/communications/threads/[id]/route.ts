import { requirePermission } from "@/lib/api-auth";
import { getThreadDetail, patchThread } from "@/lib/communications/threads";
import { z } from "zod";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;
  const { id } = await context.params;
  const detail = await getThreadDetail(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}

const patchSchema = z.object({
  status: z.enum(["OPEN", "ARCHIVED", "CLOSED"]).optional(),
  important: z.boolean().optional(),
  assignedStaffName: z.string().nullable().optional(),
  assignedAdminId: z.string().nullable().optional(),
  markRead: z.boolean().optional(),
  markUnread: z.boolean().optional(),
});

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requirePermission("messages", "edit");
  if (error) return error;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const ok = await patchThread(id, parsed.data);
  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  const detail = await getThreadDetail(id);
  return NextResponse.json(detail);
}
