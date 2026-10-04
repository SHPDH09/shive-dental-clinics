import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import {
  DAY_LABELS,
  generateTimeSlotsForDay,
  intersectDaySchedules,
  parseLocalDateIso,
  parseWeeklySchedule,
  WEEKDAY_KEYS,
  weekdayKeyFromDate,
  type WeekdayKey,
  type WeeklySchedule,
} from "@/lib/doctor-schedule";

const BLOCKING_STATUSES = ["PENDING", "CONFIRMED"];

export type PublicSlotStatus = "available" | "booked" | "past";

export type PublicAppointmentSlot = {
  time: string;
  status: PublicSlotStatus;
};

async function getDoctorSchedule(doctorId: string): Promise<WeeklySchedule | null> {
  try {
    const row = await prisma.doctor.findFirst({
      where: { id: doctorId, enabled: true },
      select: { weeklySchedule: true },
    });
    if (!row) return null;
    return parseWeeklySchedule(row.weeklySchedule);
  } catch {
    if (!getSupabaseSecretKey()) return null;
    const sb = createSupabaseServiceClient();
    const { data } = await sb
      .from("Doctor")
      .select("weeklySchedule")
      .eq("id", doctorId)
      .eq("enabled", true)
      .maybeSingle();
    if (!data) return null;
    return parseWeeklySchedule(data.weeklySchedule);
  }
}

async function getBranchSchedule(branchId: string): Promise<WeeklySchedule | null> {
  try {
    const row = await prisma.branch.findFirst({
      where: { id: branchId, published: true, status: "ACTIVE" },
      select: { weeklySchedule: true },
    });
    if (!row) return null;
    return parseWeeklySchedule(row.weeklySchedule);
  } catch {
    if (!getSupabaseSecretKey()) return null;
    const sb = createSupabaseServiceClient();
    const { data } = await sb
      .from("Branch")
      .select("weeklySchedule")
      .eq("id", branchId)
      .eq("published", true)
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (!data) return null;
    return parseWeeklySchedule(data.weeklySchedule);
  }
}

async function getBookedTimes(doctorId: string | null, date: Date): Promise<Set<string>> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const booked = new Set<string>();

  if (useSupabaseCrud()) {
    const sb = createSupabaseServiceClient();
    let query = sb
      .from("Appointment")
      .select("appointmentTime, status, doctorId")
      .gte("appointmentDate", start.toISOString())
      .lte("appointmentDate", end.toISOString())
      .in("status", BLOCKING_STATUSES);
    if (doctorId) query = query.eq("doctorId", doctorId);
    const { data } = await query;
    for (const row of data ?? []) {
      booked.add(String(row.appointmentTime).slice(0, 5));
    }
    return booked;
  }

  const rows = await prisma.appointment.findMany({
    where: {
      appointmentDate: { gte: start, lte: end },
      status: { in: ["PENDING", "CONFIRMED"] },
      ...(doctorId ? { doctorId } : { doctorId: null }),
    },
    select: { appointmentTime: true },
  });
  for (const r of rows) booked.add(r.appointmentTime.slice(0, 5));
  return booked;
}

function isSlotInPast(date: Date, time: string): boolean {
  const now = new Date();
  if (date.toDateString() !== now.toDateString()) return false;
  const [h, m] = time.split(":").map((x) => parseInt(x, 10));
  const slotAt = new Date(date);
  slotAt.setHours(h ?? 0, m ?? 0, 0, 0);
  return slotAt.getTime() <= now.getTime();
}

export type BookingWeekdayInfo = {
  key: WeekdayKey;
  label: string;
  shortLabel: string;
  enabled: boolean;
  start: string | null;
  end: string | null;
};

function resolveBookingDaySchedule(
  doctorSchedule: WeeklySchedule,
  branchId: string | null | undefined,
  dayKey: WeekdayKey,
  branchSchedule?: WeeklySchedule | null,
) {
  const doctorDay = doctorSchedule[dayKey];
  if (!branchId) return doctorDay;
  const branch = branchSchedule ?? null;
  if (!branch) return { enabled: false, start: doctorDay.start, end: doctorDay.end };
  return intersectDaySchedules(branch[dayKey], doctorDay);
}

export async function getPublicBookingAvailability(
  doctorId: string,
  branchId?: string | null,
): Promise<{ weekdays: BookingWeekdayInfo[] }> {
  const doctorSchedule = await getDoctorSchedule(doctorId);
  if (!doctorSchedule) return { weekdays: [] };

  const branchSchedule = branchId ? await getBranchSchedule(branchId) : null;

  const weekdays: BookingWeekdayInfo[] = WEEKDAY_KEYS.map((key) => {
    const bookingDay = resolveBookingDaySchedule(doctorSchedule, branchId, key, branchSchedule);
    return {
      key,
      label: DAY_LABELS[key],
      shortLabel: DAY_LABELS[key].slice(0, 3),
      enabled: bookingDay.enabled,
      start: bookingDay.enabled ? bookingDay.start : null,
      end: bookingDay.enabled ? bookingDay.end : null,
    };
  });

  return { weekdays };
}

export function isDateOpenForBooking(dateIso: string, weekdays: BookingWeekdayInfo[]): boolean {
  const date = parseLocalDateIso(dateIso);
  if (Number.isNaN(date.getTime())) return false;
  const dayKey = weekdayKeyFromDate(date);
  return weekdays.find((w) => w.key === dayKey)?.enabled ?? false;
}

export async function getPublicAppointmentSlots(
  doctorId: string,
  dateIso: string,
  branchId?: string | null,
): Promise<{ slots: PublicAppointmentSlot[]; closed: boolean; dayLabel?: string }> {
  const date = parseLocalDateIso(dateIso);
  if (Number.isNaN(date.getTime())) return { slots: [], closed: true };

  const doctorSchedule = await getDoctorSchedule(doctorId);
  if (!doctorSchedule) return { slots: [], closed: true };

  const dayKey = weekdayKeyFromDate(date);
  const branchSchedule = branchId ? await getBranchSchedule(branchId) : null;
  const bookingDay = resolveBookingDaySchedule(doctorSchedule, branchId ?? null, dayKey, branchSchedule);

  if (!bookingDay.enabled) {
    return { slots: [], closed: true, dayLabel: DAY_LABELS[dayKey] };
  }

  const allTimes = generateTimeSlotsForDay(bookingDay);
  const booked = await getBookedTimes(doctorId, date);

  const slots: PublicAppointmentSlot[] = allTimes.map((time) => {
    if (isSlotInPast(date, time)) return { time, status: "past" };
    if (booked.has(time)) return { time, status: "booked" };
    return { time, status: "available" };
  });

  return { slots, closed: false, dayLabel: DAY_LABELS[dayKey] };
}

/** @deprecated Prefer getPublicAppointmentSlots — kept for callers expecting available-only list */
export async function getAvailableAppointmentSlots(
  doctorId: string,
  dateIso: string,
  branchId?: string | null,
): Promise<{ slots: string[]; closed: boolean }> {
  const { slots, closed } = await getPublicAppointmentSlots(doctorId, dateIso, branchId);
  if (closed) return { slots: [], closed: true };
  return {
    slots: slots.filter((s) => s.status === "available").map((s) => s.time),
    closed: false,
  };
}

export async function isAppointmentSlotAvailable(
  doctorId: string | null | undefined,
  dateIso: string,
  time: string,
  branchId?: string | null,
): Promise<boolean> {
  const normalizedTime = time.slice(0, 5);
  if (doctorId) {
    const { slots, closed } = await getPublicAppointmentSlots(doctorId, dateIso, branchId);
    if (closed) return false;
    const match = slots.find((s) => s.time === normalizedTime);
    return match?.status === "available";
  }

  const booked = await getBookedTimes(null, parseLocalDateIso(dateIso));
  return !booked.has(normalizedTime);
}
