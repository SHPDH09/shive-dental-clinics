import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requirePermission("leads", "view");
  if (error) return error;

  const rows = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = "Lead ID,Name,Phone,Email,Source,Service,Status,Priority,Created\n";
  const lines = rows.map((l) =>
    [
      l.leadCode,
      `"${l.name.replace(/"/g, '""')}"`,
      l.phone,
      l.email ?? "",
      l.source,
      l.interestedService ?? "",
      l.status,
      l.priority,
      format(l.createdAt, "yyyy-MM-dd"),
    ].join(","),
  );

  return new NextResponse(header + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
