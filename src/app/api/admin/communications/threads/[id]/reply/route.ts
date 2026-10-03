import { requirePermission } from "@/lib/api-auth";
import { getThreadDetail } from "@/lib/communications/threads";
import { sendCommunication } from "@/lib/communications/send";
import { renderTemplate, buildClinicTemplateVars } from "@/lib/communications/template-render";
import { loadSettingsRow } from "@/lib/clinic-settings/service";
import { z } from "zod";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const schema = z.object({
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL"]),
  message: z.string().min(1),
  subject: z.string().optional(),
});

export async function POST(req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("messages", "create");
  if (error) return error;

  const { id } = await context.params;
  const thread = await getThreadDetail(id);
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await loadSettingsRow().catch(() => null);
  const vars = buildClinicTemplateVars({
    patientName: thread.contactName,
    patientCode: thread.patientCode ?? undefined,
    branchName: thread.branchName ?? undefined,
    clinicPhone: String(settings?.phone ?? ""),
    clinicWhatsApp: String(settings?.whatsapp ?? settings?.phone ?? ""),
  });
  const message = renderTemplate(parsed.data.message, vars);
  const subject = parsed.data.subject ? renderTemplate(parsed.data.subject, vars) : undefined;

  const results = await sendCommunication({
    channels: [parsed.data.channel],
    recipientName: thread.contactName,
    phone: thread.phone,
    email: thread.email,
    patientId: thread.patientId,
    leadId: thread.leadId,
    enquiryId: thread.enquiryId,
    subject,
    message,
    sentByAdminId: session!.user.id,
    sentByStaffName: session!.user.name,
  });

  const detail = await getThreadDetail(id);
  return NextResponse.json({ results, thread: detail });
}
