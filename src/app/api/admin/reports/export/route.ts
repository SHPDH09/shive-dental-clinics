import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildReportsData } from "@/lib/reports/build-reports";
import { csvWithMeta, toCsv } from "@/lib/reports/csv";
import {
  buildExcelHtml,
  buildReportCsv,
  buildReportHtml,
} from "@/lib/reports/export-document";
import { parseReportFilters } from "@/lib/reports/parse-params";
import { reportsAccessForRole } from "@/lib/reports/permissions";
import type { CustomReportType } from "@/lib/reports/types";
import { NextResponse } from "next/server";

const LEGACY_TYPES = new Set(["appointments", "patients", "leads"]);
const SECTION_TYPES = new Set([
  "summary",
  "appointments",
  "patients",
  "leads",
  "services",
  "doctors",
  "branches",
  "full",
]);

function appointmentWhereFromFilters(filters: ReturnType<typeof parseReportFilters>) {
  return {
    appointmentDate: { gte: filters.from, lte: filters.to },
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
    ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
    ...(filters.appointmentStatus ? { status: filters.appointmentStatus } : {}),
  };
}

async function legacyCsv(
  type: string,
  clinicName: string,
  filters: ReturnType<typeof parseReportFilters>,
  allowPatients: boolean,
) {
  if (type === "appointments") {
    const items = await prisma.appointment.findMany({
      where: appointmentWhereFromFilters(filters),
      orderBy: { appointmentDate: "desc" },
    });
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
        "branchId",
        "doctorId",
        "serviceId",
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
        branchId: a.branchId,
        doctorId: a.doctorId,
        serviceId: a.serviceId,
        notes: a.notes,
        createdAt: a.createdAt,
      })),
    );
    return csvWithMeta(clinicName, "Appointments export", csv);
  }

  if (type === "leads") {
    const items = await prisma.lead.findMany({
      where: {
        createdAt: { gte: filters.from, lte: filters.to },
        ...(filters.leadSource ? { source: filters.leadSource } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
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
      items.map((l) => ({ ...l })),
    );
    return csvWithMeta(clinicName, "Leads export", csv);
  }

  if (type === "patients") {
    if (!allowPatients) {
      return null;
    }
    const items = await prisma.patient.findMany({
      where: { createdAt: { lte: filters.to } },
      orderBy: { createdAt: "desc" },
    });
    const csv = toCsv(
      [
        "patientCode",
        "name",
        "phone",
        "email",
        "gender",
        "dateOfBirth",
        "address",
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
        createdAt: p.createdAt,
      })),
    );
    return csvWithMeta(clinicName, "Patients export", csv);
  }

  return null;
}

export async function GET(req: Request) {
  const { session, admin, error } = await requirePermission("reports", "export");
  if (error) return error;

  const access = reportsAccessForRole(session!.user.role, admin);
  const { searchParams } = new URL(req.url);
  const filters = parseReportFilters(searchParams);
  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const type = (searchParams.get("type") ?? "full").toLowerCase() as CustomReportType | string;
  const section = searchParams.get("section") ?? type;

  const settings = await prisma.clinicSettings.findUnique({ where: { id: "default" } });
  const clinicName = settings?.clinicName ?? "Shiv Dental Clinic";

  if (LEGACY_TYPES.has(type) && !searchParams.get("section")) {
    if (type === "patients" && !access.patientsDetail) {
      return NextResponse.json({ error: "Forbidden — patient export not allowed" }, { status: 403 });
    }
    const csv = await legacyCsv(type, clinicName, filters, access.patientsDetail);
    if (!csv) {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }
    const filename = `${type}-${filters.from.toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const sec = SECTION_TYPES.has(section) ? section : "full";
  const data = await buildReportsData(filters, access);
  if (!access.revenue) {
    data.revenue = null;
    data.summary.revenue = null;
  }

  const stamp = filters.from.toISOString().slice(0, 10);
  const baseName = `shiv-report-${sec}-${stamp}`;

  if (format === "pdf") {
    const html = buildReportHtml(data, sec);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.html"`,
      },
    });
  }

  if (format === "xlsx" || format === "excel") {
    const html = buildExcelHtml(data, sec);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.xls"`,
      },
    });
  }

  const csv = buildReportCsv(data, sec);
  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.csv"`,
    },
  });
}
