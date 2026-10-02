import { requirePermission } from "@/lib/api-auth";
import { generatePatientCode } from "@/lib/patients/patient-code";
import { findDuplicatePatients } from "@/lib/patients/build-patient-dashboard";
import { logPatientActivity } from "@/lib/patients/patient-activity";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

export async function POST(req: Request) {
  const { session, error } = await requirePermission("patients", "create");
  if (error) return error;

  const body = (await req.json()) as { csv?: string; confirm?: boolean; rows?: Record<string, string>[] };
  const parsed = body.rows ?? (body.csv ? parseCsv(body.csv) : []);

  const preview = [];
  for (const row of parsed) {
    const name = row.name || row["full name"] || "";
    const phone = row.phone || row["phone number"] || "";
    const email = row.email || "";
    const issues: string[] = [];
    if (name.length < 2) issues.push("Name required");
    if (phone.replace(/\D/g, "").length < 10) issues.push("Valid phone required");
    const duplicates = phone ? await findDuplicatePatients(phone, email) : [];
    preview.push({ row, issues, duplicates });
  }

  if (!body.confirm) {
    return NextResponse.json({ preview, valid: preview.filter((p) => p.issues.length === 0).length });
  }

  let imported = 0;
  for (const item of preview) {
    if (item.issues.length > 0) continue;
    if (item.duplicates.length > 0) continue;
    const name = item.row.name || item.row["full name"]!;
    const phone = item.row.phone || item.row["phone number"]!;
    const email = item.row.email || null;
    const code = await generatePatientCode();
    const patient = await prisma.patient.create({
      data: {
        patientCode: code,
        name,
        phone,
        email: email || null,
      },
    });
    await logPatientActivity({
      patientId: patient.id,
      kind: "import",
      title: "Patient imported",
      createdBy: session!.user.id,
    });
    imported += 1;
  }

  return NextResponse.json({ imported, total: preview.length });
}
