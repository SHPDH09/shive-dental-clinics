import { requirePermission } from "@/lib/api-auth";
import { logPatientActivity } from "@/lib/patients/patient-activity";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { z } from "zod";
import { NextResponse } from "next/server";

const paymentSchema = z.object({
  treatmentName: z.string().optional(),
  amountBilled: z.number().nonnegative(),
  amountPaid: z.number().nonnegative().optional(),
  method: z.string().optional(),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "REFUNDED"]).optional(),
  invoiceRef: z.string().optional(),
  notes: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { error } = await requirePermission("patients", "view");
  if (error) return error;

  const { id } = await context.params;

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { data, error: qErr } = await sb
      .from("PatientPayment")
      .select("*")
      .eq("patientId", id)
      .order("createdAt", { ascending: false });
    if (qErr) return NextResponse.json({ items: [], warning: qErr.message });
    return NextResponse.json({ items: data ?? [] });
  }

  const items = await prisma.patientPayment.findMany({
    where: { patientId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("patients", "edit");
  if (error) return error;

  const { id: patientId } = await context.params;
  const parsed = paymentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const amountPaid = d.amountPaid ?? 0;
  const status =
    d.status ??
    (amountPaid >= d.amountBilled ? "PAID" : amountPaid > 0 ? "PARTIAL" : "PENDING");

  const row = {
    id: createId(),
    patientId,
    treatmentName: d.treatmentName ?? null,
    amountBilled: d.amountBilled,
    amountPaid,
    method: d.method ?? null,
    status,
    invoiceRef: d.invoiceRef ?? null,
    notes: d.notes ?? null,
    paidAt: amountPaid > 0 ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  };

  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    const { error: insErr } = await sb.from("PatientPayment").insert(row);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 503 });
  } else {
    await prisma.patientPayment.create({
      data: {
        patientId,
        treatmentName: d.treatmentName,
        amountBilled: d.amountBilled,
        amountPaid,
        method: d.method,
        status,
        invoiceRef: d.invoiceRef,
        notes: d.notes,
        paidAt: amountPaid > 0 ? new Date() : null,
      },
    });
  }

  await logPatientActivity({
    patientId,
    kind: "payment",
    title: `Payment recorded — ₹${amountPaid} / ₹${d.amountBilled} (${status})`,
    detail: d.treatmentName ?? undefined,
    createdBy: session!.user.id,
  });

  return NextResponse.json({ ok: true });
}
