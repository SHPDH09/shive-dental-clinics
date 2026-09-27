import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const str =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "appointments") {
    const items = await prisma.appointment.findMany({ orderBy: { createdAt: "desc" } });
    const csv = toCsv(
      [
        "appointmentCode",
        "patientName",
        "phone",
        "email",
        "treatmentName",
        "appointmentDate",
        "appointmentTime",
        "status",
        "notes",
        "createdAt",
      ],
      items.map((a) => ({
        appointmentCode: a.appointmentCode,
        patientName: a.patientName,
        phone: a.phone,
        email: a.email,
        treatmentName: a.treatmentName,
        appointmentDate: a.appointmentDate,
        appointmentTime: a.appointmentTime,
        status: a.status,
        notes: a.notes,
        createdAt: a.createdAt,
      })),
    );
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="appointments.csv"',
      },
    });
  }

  if (type === "leads") {
    const items = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
    const csv = toCsv(
      [
        "name",
        "phone",
        "email",
        "source",
        "interestedService",
        "status",
        "followUpDate",
        "notes",
        "assignedStaff",
        "createdAt",
      ],
      items.map((l) => ({
        name: l.name,
        phone: l.phone,
        email: l.email,
        source: l.source,
        interestedService: l.interestedService,
        status: l.status,
        followUpDate: l.followUpDate,
        notes: l.notes,
        assignedStaff: l.assignedStaff,
        createdAt: l.createdAt,
      })),
    );
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leads.csv"',
      },
    });
  }

  if (type === "patients") {
    const items = await prisma.patient.findMany({ orderBy: { createdAt: "desc" } });
    const csv = toCsv(
      [
        "patientCode",
        "name",
        "phone",
        "email",
        "gender",
        "dateOfBirth",
        "address",
        "medicalNotes",
        "createdAt",
      ],
      items.map((p) => ({
        patientCode: p.patientCode,
        name: p.name,
        phone: p.phone,
        email: p.email,
        gender: p.gender,
        dateOfBirth: p.dateOfBirth,
        address: p.address,
        medicalNotes: p.medicalNotes,
        createdAt: p.createdAt,
      })),
    );
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="patients.csv"',
      },
    });
  }

  return NextResponse.json(
    { error: "Invalid type. Use appointments, leads, or patients." },
    { status: 400 },
  );
}
