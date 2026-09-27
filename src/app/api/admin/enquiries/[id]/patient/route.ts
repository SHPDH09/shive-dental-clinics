import { requireAdminSession } from "@/lib/api-auth";
import { findPatientIdByPhone, getPatientContext } from "@/lib/enquiry-helpers";
import { prisma } from "@/lib/prisma";
import { supabaseFindUnique } from "@/lib/supabase/crud";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  let patientId: string | null = null;
  let phone = "";

  if (useSupabaseCrud()) {
    const row = await supabaseFindUnique("enquiry", id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    patientId = (row.patientId as string | null) ?? null;
    phone = String(row.phone);
  } else {
    const row = await prisma.enquiry.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    patientId = row.patientId;
    phone = row.phone;
  }

  if (!patientId) {
    patientId = await findPatientIdByPhone(phone);
  }

  if (!patientId) {
    return NextResponse.json({ linked: false, patient: null });
  }

  const patient = await getPatientContext(patientId);
  return NextResponse.json({ linked: true, patient });
}
