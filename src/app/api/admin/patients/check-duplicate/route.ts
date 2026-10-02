import { requirePermission } from "@/lib/api-auth";
import { findDuplicatePatients } from "@/lib/patients/build-patient-dashboard";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { error } = await requirePermission("patients", "create");
  if (error) return error;

  const body = (await req.json()) as { phone?: string; email?: string };
  if (!body.phone?.trim()) {
    return NextResponse.json({ duplicates: [] });
  }

  const duplicates = await findDuplicatePatients(body.phone, body.email);
  return NextResponse.json({ duplicates });
}
