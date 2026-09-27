import type { ReportsPayload } from "@/lib/reports/types";
import { toCsv, csvWithMeta } from "@/lib/reports/csv";

export function buildReportCsv(data: ReportsPayload, section: string): string {
  const rows: Record<string, unknown>[] = [];
  let headers: string[] = [];

  switch (section) {
    case "summary":
      headers = ["metric", "value"];
      rows.push(
        { metric: "Total appointments", value: data.summary.totalAppointments },
        { metric: "Total patients", value: data.summary.totalPatients },
        { metric: "New leads", value: data.summary.newLeads },
        { metric: "Completed appointments", value: data.summary.completedAppointments },
        { metric: "Conversion rate %", value: data.summary.conversionRate },
      );
      if (data.summary.revenue != null) {
        rows.push({ metric: "Revenue (estimated)", value: data.summary.revenue });
      }
      break;
    case "appointments":
      headers = ["status", "count"];
      rows.push(
        { status: "Total", count: data.appointments.total },
        { status: "Pending", count: data.appointments.pending },
        { status: "Confirmed", count: data.appointments.confirmed },
        { status: "Completed", count: data.appointments.completed },
        { status: "Cancelled", count: data.appointments.cancelled },
        { status: "No Show", count: data.appointments.noShow },
        { status: "Completion rate %", count: data.appointments.completionRate },
      );
      break;
    case "services":
      headers = ["service", "appointments", "completed"];
      for (const s of data.services.topServices) {
        rows.push({ service: s.name, appointments: s.appointments, completed: s.completed });
      }
      break;
    case "doctors":
      headers = [
        "doctor",
        "total",
        "completed",
        "cancelled",
        "noShow",
        "completionRate",
        "servicesHandled",
        "patients",
      ];
      for (const d of data.doctors.rows) {
        rows.push({
          doctor: d.name,
          total: d.total,
          completed: d.completed,
          cancelled: d.cancelled,
          noShow: d.noShow,
          completionRate: d.completionRate,
          servicesHandled: d.servicesHandled,
          patients: d.patientCount,
        });
      }
      break;
    case "branches":
      headers = [
        "branch",
        "appointments",
        "patients",
        "completed",
        "cancelled",
        "topService",
        "doctorAppointments",
      ];
      for (const b of data.branches.rows) {
        rows.push({
          branch: b.name,
          appointments: b.appointments,
          patients: b.patients,
          completed: b.completed,
          cancelled: b.cancelled,
          topService: b.topService ?? "",
          doctorAppointments: b.doctorAppointments,
        });
      }
      break;
    case "leads":
      headers = ["source", "count", "converted", "conversionRate"];
      for (const l of data.leads.bySource) {
        rows.push({
          source: l.source,
          count: l.count,
          converted: l.converted,
          conversionRate: l.conversionRate,
        });
      }
      break;
    case "patients":
      headers = ["metric", "value"];
      rows.push(
        { metric: "Total patients", value: data.patients.total },
        { metric: "New in range", value: data.patients.newInRange },
        { metric: "Returning", value: data.patients.returning },
        { metric: "Active in range", value: data.patients.activeInRange },
      );
      break;
    case "full":
    default:
      return buildReportCsv(data, "summary") + "\n\n" + buildReportCsv(data, "appointments");
  }

  const body = toCsv(headers, rows);
  return csvWithMeta(data.clinicName, `${section} report`, body);
}

export function buildReportHtml(data: ReportsPayload, section: string): string {
  const csvSection = buildReportCsv(data, section);
  const escaped = csvSection
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${data.clinicName} — Report</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; color: #0f172a; }
    h1 { font-size: 1.5rem; }
    pre { white-space: pre-wrap; background: #f8fafc; padding: 1rem; border-radius: 8px; }
    @media print { body { padding: 0.5in; } }
  </style>
</head>
<body>
  <h1>${data.clinicName}</h1>
  <p>Generated: ${data.generatedAt}</p>
  <p>Period: ${data.filters.from.slice(0, 10)} to ${data.filters.to.slice(0, 10)}</p>
  <pre>${escaped}</pre>
  <script>window.onload = () => { try { window.print(); } catch {} };</script>
</body>
</html>`;
}

export function buildExcelHtml(data: ReportsPayload, section: string): string {
  const csv = buildReportCsv(data, section);
  const tableRows = csv
    .split("\n")
    .slice(2)
    .map((line) => {
      const cells = line.split(",").map((c) => `<td>${c.replace(/^"|"$/g, "")}</td>`);
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"></head>
<body>
<table>
<tr><td colspan="4"><b>${data.clinicName}</b></td></tr>
<tr><td colspan="4">Generated: ${data.generatedAt}</td></tr>
${tableRows}
</table>
</body></html>`;
}
