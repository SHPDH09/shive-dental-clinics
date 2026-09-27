import type { AppointmentStatus, LeadSource } from "@/generated/prisma/client";

export type DatePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "this_year"
  | "custom";

export type ReportFilters = {
  preset: DatePreset;
  from: Date;
  to: Date;
  branchId?: string;
  doctorId?: string;
  serviceId?: string;
  appointmentStatus?: AppointmentStatus;
  leadSource?: LeadSource;
};

export type ReportsAccess = {
  summary: boolean;
  appointments: boolean;
  patients: boolean;
  patientsDetail: boolean;
  leads: boolean;
  services: boolean;
  doctors: boolean;
  branches: boolean;
  revenue: boolean;
  retention: boolean;
  customReport: boolean;
  exportCsv: boolean;
  exportExcel: boolean;
  exportPdf: boolean;
};

export type ReportsPayload = {
  generatedAt: string;
  clinicName: string;
  filters: {
    preset: DatePreset;
    from: string;
    to: string;
    branchId: string | null;
    doctorId: string | null;
    serviceId: string | null;
    appointmentStatus: string | null;
    leadSource: string | null;
  };
  access: ReportsAccess;
  revenueEnabled: boolean;
  summary: {
    totalAppointments: number;
    totalPatients: number;
    newLeads: number;
    completedAppointments: number;
    conversionRate: number;
    revenue: string | null;
  };
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
    completionRate: number;
    trend: { label: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
    peakHours: { hour: string; count: number }[];
    byDayOfWeek: { day: string; count: number }[];
  };
  patients: {
    total: number;
    newInRange: number;
    returning: number;
    activeInRange: number;
    byBranch: { branch: string; count: number }[];
    byAgeGroup: { group: string; count: number }[];
    byGender: { gender: string; count: number }[];
    growthTrend: { label: string; count: number }[];
    newVsReturningTrend: { label: string; new: number; returning: number }[];
  };
  leads: {
    total: number;
    new: number;
    contacted: number;
    followUp: number;
    converted: number;
    lost: number;
    bySource: { source: string; count: number; converted: number; conversionRate: number }[];
    enquiriesInRange: number;
  };
  services: {
    topServices: { name: string; appointments: number; completed: number }[];
    monthlyTrend: { label: string; count: number }[];
    byBranch: { branch: string; service: string; count: number }[];
  };
  doctors: {
    rows: {
      id: string;
      name: string;
      total: number;
      completed: number;
      cancelled: number;
      noShow: number;
      completionRate: number;
      servicesHandled: number;
      patientCount: number;
    }[];
  };
  branches: {
    rows: {
      id: string;
      name: string;
      appointments: number;
      patients: number;
      newLeads: number;
      completed: number;
      cancelled: number;
      topService: string | null;
      doctorAppointments: number;
    }[];
  };
  revenue: {
    totalEstimated: string;
    byService: { name: string; amount: string }[];
    byBranch: { branch: string; amount: string }[];
    byDoctor: { doctor: string; amount: string }[];
    trend: { label: string; amount: number }[];
  } | null;
  retention: {
    newPatients: number;
    returningPatients: number;
    repeatAppointmentRate: number;
    followUpAppointments: number;
    patientsNeedingFollowUp: number;
    monthlyTrend: { label: string; new: number; returning: number; repeatRate: number }[];
  };
  dbUnavailable?: boolean;
};

export type CustomReportType =
  | "appointments"
  | "patients"
  | "leads"
  | "services"
  | "doctors"
  | "branches";
