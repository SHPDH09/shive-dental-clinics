import { requirePermission } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sendCommunication } from "@/lib/communications/send";
import { renderTemplate, buildClinicTemplateVars } from "@/lib/communications/template-render";
import { loadSettingsRow } from "@/lib/clinic-settings/service";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { z } from "zod";
import { NextResponse } from "next/server";

const schema = z.object({
  channels: z.array(z.enum(["WHATSAPP", "SMS", "EMAIL", "IN_APP"])).min(1),
  patientId: z.string().optional(),
  leadId: z.string().optional(),
  recipientName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1),
  templateSlug: z.string().optional(),
  templateVars: z.record(z.string(), z.string()).optional(),
  marketing: z.boolean().optional(),
  bulkConfirmed: z.boolean().optional(),
});

export async function POST(req: Request) {
  const { session, error } = await requirePermission("messages", "create");
  if (error) return error;

  const limited = enforceRateLimit(req, "comm-send", 30, 60 * 1000);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  if (data.channels.length > 1 && !data.bulkConfirmed) {
    return NextResponse.json(
      { error: "Confirm sending on multiple channels", requireBulkConfirm: true },
      { status: 400 },
    );
  }

  const settings = await loadSettingsRow().catch(() => null);
  const clinicPhone = String(settings?.phone ?? "");
  const clinicWhatsApp = String(settings?.whatsapp ?? settings?.phone ?? "");

  let commPrefs: { commWhatsApp?: boolean; commPhone?: boolean; commEmail?: boolean } | undefined;
  if (data.patientId) {
    if (useSupabaseCrud()) {
      const sb = await getAdminSupabaseClient();
      const { data: p } = await sb.from("Patient").select("commWhatsApp, commPhone, commEmail").eq("id", data.patientId).maybeSingle();
      if (p) commPrefs = { commWhatsApp: Boolean(p.commWhatsApp), commPhone: Boolean(p.commPhone), commEmail: Boolean(p.commEmail) };
    } else {
      const p = await prisma.patient.findUnique({
        where: { id: data.patientId },
        select: { commWhatsApp: true, commPhone: true, commEmail: true },
      });
      if (p) commPrefs = p;
    }
  }

  const extraVars = data.templateVars ?? {};
  const vars = buildClinicTemplateVars({
    patientName: data.recipientName,
    patientCode: extraVars.patient_id,
    doctorName: extraVars.doctor_name,
    serviceName: extraVars.service_name,
    appointmentDate: extraVars.appointment_date ?? extraVars.date,
    appointmentTime: extraVars.appointment_time ?? extraVars.time,
    branchName: extraVars.branch_name,
    clinicPhone,
    clinicWhatsApp,
  });
  const merged = { ...vars, ...extraVars };
  const message = renderTemplate(data.message, merged);
  const subject = data.subject ? renderTemplate(data.subject, merged) : undefined;

  const results = await sendCommunication({
    channels: data.channels,
    recipientName: data.recipientName,
    phone: data.phone,
    email: data.email,
    patientId: data.patientId,
    leadId: data.leadId,
    subject,
    message,
    templateSlug: data.templateSlug,
    sentByAdminId: session!.user.id,
    marketing: data.marketing,
    commPrefs,
  });

  return NextResponse.json({ results });
}
