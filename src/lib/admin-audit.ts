import { createId } from "@paralleldrive/cuid2";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer, getAdminSupabaseClient } from "@/lib/supabase/data-client";

export type AuditInput = {
  adminId?: string | null;
  adminName: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  metadata?: Record<string, unknown>;
};

/** Best-effort audit log when AdminActivityLog table exists. */
export async function writeAdminAudit(entry: AuditInput): Promise<void> {
  const row = {
    id: createId(),
    adminId: entry.adminId ?? null,
    adminName: entry.adminName.slice(0, 120),
    action: entry.action.slice(0, 80),
    entityType: entry.entityType?.slice(0, 60) ?? null,
    entityId: entry.entityId?.slice(0, 64) ?? null,
    entityLabel: entry.entityLabel?.slice(0, 200) ?? null,
    metadata: entry.metadata ?? null,
    createdAt: new Date(),
  };

  try {
    if (canUseSupabaseDataLayer()) {
      const sb = await getAdminSupabaseClient();
      await sb.from("AdminActivityLog").insert({
        ...row,
        createdAt: row.createdAt.toISOString(),
        metadata: row.metadata,
      });
      return;
    }
    await prisma.adminActivityLog.create({
      data: {
        ...row,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (e) {
    console.error("Audit log write failed:", e);
  }
}
