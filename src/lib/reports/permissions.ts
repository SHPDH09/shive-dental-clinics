import type { AdminContext } from "@/lib/admin-context";
import { can } from "@/lib/rbac/permissions";
import type { ReportsAccess } from "@/lib/reports/types";

/** SUPER_ADMIN sees everything; STAFF gets operational analytics without revenue or patient export detail. */
export function reportsAccessForRole(role?: string | null, admin?: AdminContext | null): ReportsAccess {
  if (admin?.permissions && !can(admin.permissions, "reports", "view")) {
    return {
      summary: false,
      appointments: false,
      patients: false,
      patientsDetail: false,
      leads: false,
      services: false,
      doctors: false,
      branches: false,
      revenue: false,
      retention: false,
      customReport: false,
      exportCsv: false,
      exportExcel: false,
      exportPdf: false,
    };
  }

  const exportAllowed =
    admin?.permissions != null
      ? can(admin.permissions, "reports", "export")
      : role !== "RECEPTIONIST";

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
      exportPdf: exportAllowed,
    };
  }

  if (role === "RECEPTIONIST") {
    return {
      summary: false,
      appointments: false,
      patients: false,
      patientsDetail: false,
      leads: false,
      services: false,
      doctors: false,
      branches: false,
      revenue: false,
      retention: false,
      customReport: false,
      exportCsv: false,
      exportExcel: false,
      exportPdf: false,
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
    exportCsv: exportAllowed,
    exportExcel: exportAllowed,
    exportPdf: exportAllowed,
  };
}
