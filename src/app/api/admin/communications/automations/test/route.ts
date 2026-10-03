import { requirePermission } from "@/lib/api-auth";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { z } from "zod";
import { NextResponse } from "next/server";

const schema = z.object({
  automationId: z.string(),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const { error } = await requirePermission("messages", "create");
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const row = {
    id: createId(),
    automationId: parsed.data.automationId,
    status: "TEST",
    detail: parsed.data.note ?? "Manual test run (no messages sent)",
    recipientCount: 0,
    createdAt: new Date().toISOString(),
  };

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { error: insErr } = await sb.from("CommunicationAutomationRun").insert(row);
    if (insErr) {
      return NextResponse.json({ ok: true, warning: "Run log table not migrated yet", detail: row.detail });
    }
  } else {
    try {
      await prisma.communicationAutomationRun.create({
        data: {
          automationId: parsed.data.automationId,
          status: "TEST",
          detail: row.detail,
        },
      });
    } catch {
      return NextResponse.json({ ok: true, warning: "Run log table not migrated yet", detail: row.detail });
    }
  }

  return NextResponse.json({ ok: true, detail: row.detail });
}
