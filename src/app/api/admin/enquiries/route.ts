import { requireAdminSession } from "@/lib/api-auth";
import { enquiryStatusCounts, listAdminEnquiries } from "@/lib/admin-enquiries";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "30", 10));
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const source = searchParams.get("source")?.trim();
  const assignedStaff = searchParams.get("assignedStaff")?.trim();
  const important = searchParams.get("important") === "true";
  const dateFrom = searchParams.get("dateFrom")?.trim();
  const dateTo = searchParams.get("dateTo")?.trim();
  const statsOnly = searchParams.get("stats") === "1";

  try {
    if (statsOnly) {
      const counts = await enquiryStatusCounts();
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return NextResponse.json({ counts, total });
    }

    const { items, total } = await listAdminEnquiries({
      page,
      limit,
      q,
      status,
      source,
      assignedStaff,
      important: important || undefined,
      dateFrom,
      dateTo,
    });
    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
