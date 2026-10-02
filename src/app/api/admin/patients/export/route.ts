import { requirePermission } from "@/lib/api-auth";
import { canExportPatients } from "@/lib/patients/patient-access";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { session, error } = await requirePermission("patients", "view");
  if (error) return error;

  if (!canExportPatients(session!.user.role)) {
    return NextResponse.json({ error: "Export not allowed for your role" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const formatType = searchParams.get("format") ?? "csv";

  const rows = await prisma.patient.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { preferredBranch: { select: { name: true } } },
  });

  if (formatType === "csv") {
    const header = "Patient ID,Name,Phone,Email,Gender,Branch,Status,Registered\n";
    const lines = rows.map((p) =>
      [
        p.patientCode,
        `"${p.name.replace(/"/g, '""')}"`,
        p.phone,
        p.email ?? "",
        p.gender ?? "",
        p.preferredBranch?.name ?? "",
        p.status,
        format(p.createdAt, "yyyy-MM-dd"),
      ].join(","),
    );
    const csv = header + lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="patients-${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    });
  }

  return NextResponse.json({ items: rows });
}
