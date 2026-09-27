import type { ReportsAccess } from "@/lib/reports/types";

/** SUPER_ADMIN sees everything; STAFF gets operational analytics without revenue or patient export detail. */
export function reportsAccessForRole(role?: string | null): ReportsAccess {
  if (role === "SUPER_ADMIN") {
    return {
      summary: true,
      appointments: true,
      patients: true,
      patientsDetail: true,
      leads: true,
      services: true,
      doctors: true,
      branches: true,
      revenue: true,
      retention: true,
      customReport: true,
      exportCsv: true,
      exportExcel: true,
      exportPdf: true,
    };
  }

  return {
    summary: true,
    appointments: true,
    patients: true,
    patientsDetail: false,
    leads: true,
    services: true,
    doctors: true,
    branches: true,
    revenue: false,
    retention: true,
    customReport: true,
    exportCsv: true,
    exportExcel: true,
    exportPdf: true,
  };
}
