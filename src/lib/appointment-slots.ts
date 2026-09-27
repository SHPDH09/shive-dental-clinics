import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import {
  generateTimeSlotsForDay,
  parseWeeklySchedule,
  weekdayKeyFromDate,
  type WeeklySchedule,
} from "@/lib/doctor-schedule";

const BLOCKING_STATUSES = ["PENDING", "CONFIRMED"];

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

export async function getAvailableAppointmentSlots(
  doctorId: string,
  dateIso: string,
): Promise<{ slots: string[]; closed: boolean }> {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return { slots: [], closed: true };

  const schedule = await getDoctorSchedule(doctorId);
  if (!schedule) return { slots: [], closed: true };

  const dayKey = weekdayKeyFromDate(date);
  const day = schedule[dayKey];
  if (!day.enabled) return { slots: [], closed: true };

  const allSlots = generateTimeSlotsForDay(day);
  const booked = await getBookedTimes(doctorId, date);
  const slots = allSlots.filter((t) => !booked.has(t));
  return { slots, closed: false };
}

export async function isAppointmentSlotAvailable(
  doctorId: string | null | undefined,
  dateIso: string,
  time: string,
): Promise<boolean> {
  const normalizedTime = time.slice(0, 5);
  if (doctorId) {
    const { slots, closed } = await getAvailableAppointmentSlots(doctorId, dateIso);
    if (closed) return false;
    return slots.includes(normalizedTime);
  }

  const booked = await getBookedTimes(null, new Date(dateIso));
  return !booked.has(normalizedTime);
}
