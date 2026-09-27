import { requirePermission } from "@/lib/api-auth";
import { buildReportsData, emptyReportsPayload } from "@/lib/reports/build-reports";
import { parseReportFilters } from "@/lib/reports/parse-params";
import { reportsAccessForRole } from "@/lib/reports/permissions";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { session, admin, error } = await requirePermission("reports", "view");
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const filters = parseReportFilters(searchParams);
    const access = reportsAccessForRole(session!.user.role, admin);

    const data = await buildReportsData(filters, access);

    if (!access.revenue) {
      data.revenue = null;
      data.summary.revenue = null;
      data.revenueEnabled = false;
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/admin/reports:", e);
    const { searchParams } = new URL(req.url);
    const filters = parseReportFilters(searchParams);
    const access = reportsAccessForRole(session!.user.role, admin);
    const data = emptyReportsPayload("Shiv Dental Clinic", filters, access, false);
    if (!access.revenue) {
      data.revenue = null;
      data.summary.revenue = null;
      data.revenueEnabled = false;
    }
    return NextResponse.json(data);
  }
}
