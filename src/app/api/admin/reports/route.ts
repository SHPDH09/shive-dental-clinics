import { requireAdminSession } from "@/lib/api-auth";
import { buildReportsData } from "@/lib/reports/build-reports";
import { parseReportFilters } from "@/lib/reports/parse-params";
import { reportsAccessForRole } from "@/lib/reports/permissions";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { session, error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const filters = parseReportFilters(searchParams);
  const access = reportsAccessForRole(session!.user.role);

  const data = await buildReportsData(filters, access);

  if (!access.revenue) {
    data.revenue = null;
    data.summary.revenue = null;
    data.revenueEnabled = false;
  }

  return NextResponse.json(data);
}
