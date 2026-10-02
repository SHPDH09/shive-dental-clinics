import { requirePermission } from "@/lib/api-auth";
import { logPatientActivity } from "@/lib/patients/patient-activity";
import { canViewPatientClinical } from "@/lib/patients/patient-access";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { z } from "zod";
import { NextResponse } from "next/server";

const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const docSchema = z.object({
  category: z.string().optional(),
  title: z.string().optional(),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("patients", "view");
  if (error) return error;
  if (!canViewPatientClinical(session!.user.role)) {
    return NextResponse.json({ items: [] });
  }

  const { id } = await context.params;

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data } = await sb.from("PatientDocument").select("*").eq("patientId", id);
    return NextResponse.json({ items: data ?? [] });
  }

  const items = await prisma.patientDocument.findMany({
    where: { patientId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("patients", "edit");
  if (error) return error;
  if (!canViewPatientClinical(session!.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: patientId } = await context.params;
  const parsed = docSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  if (d.sizeBytes && d.sizeBytes > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 12MB)" }, { status: 400 });
  }
  if (d.mimeType && !ALLOWED.has(d.mimeType)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const row = {
    id: createId(),
    patientId,
    category: d.category ?? "OTHER",
    title: d.title ?? null,
    fileName: d.fileName,
    fileUrl: d.fileUrl,
    mimeType: d.mimeType ?? null,
    sizeBytes: d.sizeBytes ?? null,
    uploadedBy: session!.user.id,
    createdAt: new Date().toISOString(),
  };

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    await sb.from("PatientDocument").insert(row);
  } else {
    await prisma.patientDocument.create({
      data: {
        patientId,
        category: (d.category as "OTHER") ?? "OTHER",
        title: d.title,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        uploadedBy: session!.user.id,
      },
    });
  }

  await logPatientActivity({
    patientId,
    kind: "document",
    title: `Document uploaded — ${d.fileName}`,
    createdBy: session!.user.id,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("patients", "edit");
  if (error) return error;
  if (!canViewPatientClinical(session!.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: patientId } = await context.params;
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");
  if (!docId) return NextResponse.json({ error: "docId required" }, { status: 400 });

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    await sb.from("PatientDocument").delete().eq("id", docId).eq("patientId", patientId);
  } else {
    await prisma.patientDocument.deleteMany({ where: { id: docId, patientId } });
  }

  return NextResponse.json({ ok: true });
}
