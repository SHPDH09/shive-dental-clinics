import { requirePermission } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { resolveAudience, type AudienceFilter } from "@/lib/communications/audience";
import { sendCommunication } from "@/lib/communications/send";
import { renderTemplate, buildClinicTemplateVars } from "@/lib/communications/template-render";
import { loadSettingsRow } from "@/lib/clinic-settings/service";
import { z } from "zod";
import { NextResponse } from "next/server";

const schema = z.object({
  channels: z.array(z.enum(["WHATSAPP", "SMS", "EMAIL"])).min(1),
  audienceFilter: z.record(z.string(), z.unknown()).optional(),
  recipientIds: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["patient", "lead"]),
      }),
    )
    .optional(),
  message: z.string().min(1),
  subject: z.string().optional(),
  templateSlug: z.string().optional(),
  marketing: z.boolean().optional(),
  confirmed: z.boolean(),
  scheduledAt: z.string().optional(),
});

export async function POST(req: Request) {
  const { session, error } = await requirePermission("messages", "create");
  if (error) return error;

  const limited = enforceRateLimit(req, "comm-bulk", 5, 60 * 1000);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!parsed.data.confirmed) {
    return NextResponse.json({ error: "Bulk send requires confirmation", requireConfirm: true }, { status: 400 });
  }

  if (parsed.data.scheduledAt) {
    return NextResponse.json({
      ok: true,
      scheduled: true,
      message: "Scheduled bulk sends will run when the job runner is enabled.",
      scheduledAt: parsed.data.scheduledAt,
    });
  }

  const settings = await loadSettingsRow().catch(() => null);
  const clinicVars = buildClinicTemplateVars({
    clinicPhone: String(settings?.phone ?? ""),
    clinicWhatsApp: String(settings?.whatsapp ?? settings?.phone ?? ""),
  });

  let recipients = await resolveAudience((parsed.data.audienceFilter ?? {}) as AudienceFilter, 500);
  if (parsed.data.recipientIds?.length) {
    const allowed = new Set(parsed.data.recipientIds.map((r) => `${r.type}:${r.id}`));
    recipients = recipients.filter((r) => allowed.has(`${r.type}:${r.id}`));
  }

  const results: { name: string; ok: boolean; error?: string }[] = [];
  for (const r of recipients) {
    const vars = { ...clinicVars, patient_name: r.name };
    const message = renderTemplate(parsed.data.message, vars);
    const subject = parsed.data.subject ? renderTemplate(parsed.data.subject, vars) : undefined;
    const sent = await sendCommunication({
      channels: parsed.data.channels,
      recipientName: r.name,
      phone: r.phone,
      email: r.email,
      patientId: r.type === "patient" ? r.id : undefined,
      leadId: r.type === "lead" ? r.id : undefined,
      subject,
      message,
      templateSlug: parsed.data.templateSlug,
      sentByAdminId: session!.user.id,
      sentByStaffName: session!.user.name,
      marketing: parsed.data.marketing,
    });
    results.push({
      name: r.name,
      ok: sent.every((s) => s.ok),
      error: sent.find((s) => !s.ok)?.error,
    });
  }

  return NextResponse.json({
    ok: true,
    recipientCount: recipients.length,
    successCount: results.filter((r) => r.ok).length,
    failedCount: results.filter((r) => !r.ok).length,
    results: results.slice(0, 50),
  });
}
