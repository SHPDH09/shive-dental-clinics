import { requirePermission } from "@/lib/api-auth";
import { getLeadDashboardStats } from "@/lib/leads/build-lead-dashboard";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requirePermission("leads", "view");
  if (error) return error;
  return NextResponse.json(await getLeadDashboardStats());
}
