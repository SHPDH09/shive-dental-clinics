import { requirePermission } from "@/lib/api-auth";
import { getPatientDashboardStats } from "@/lib/patients/build-patient-dashboard";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requirePermission("patients", "view");
  if (error) return error;

  const stats = await getPatientDashboardStats();
  return NextResponse.json(stats);
}
