export const WEEKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
};

export type WeeklySchedule = Record<WeekdayKey, DaySchedule>;

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: { enabled: true, start: "10:00", end: "18:00" },
  tuesday: { enabled: true, start: "10:00", end: "18:00" },
  wednesday: { enabled: true, start: "10:00", end: "18:00" },
  thursday: { enabled: true, start: "10:00", end: "18:00" },
  friday: { enabled: true, start: "10:00", end: "18:00" },
  saturday: { enabled: true, start: "10:00", end: "14:00" },
  sunday: { enabled: false, start: "10:00", end: "14:00" },
};

export const DAY_LABELS: Record<WeekdayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/** Parse `YYYY-MM-DD` as local calendar date (avoids UTC day-shift in date pickers). */
export function parseLocalDateIso(isoDate: string): Date {
  const parts = isoDate.trim().slice(0, 10).split("-").map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return new Date(NaN);
  return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
}

export function weekdayKeyFromDate(date: Date): WeekdayKey {
  const idx = date.getDay();
  const map: WeekdayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[idx];
}

export function parseWeeklySchedule(raw: unknown): WeeklySchedule {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_WEEKLY_SCHEDULE };
  const out = { ...DEFAULT_WEEKLY_SCHEDULE };
  for (const key of WEEKDAY_KEYS) {
    const day = (raw as Record<string, unknown>)[key];
    if (day && typeof day === "object") {
      const d = day as { enabled?: boolean; start?: string; end?: string };
      out[key] = {
        enabled: d.enabled ?? out[key].enabled,
        start: d.start ?? out[key].start,
        end: d.end ?? out[key].end,
      };
    }
  }
  return out;
}

export function formatWeeklyScheduleLines(schedule: WeeklySchedule): string[] {
  return WEEKDAY_KEYS.map((key) => {
    const day = schedule[key];
    if (!day.enabled) return `${DAY_LABELS[key]}      Closed`;
    return `${DAY_LABELS[key]}      ${formatTime12(day.start)} – ${formatTime12(day.end)}`;
  });
}

export function formatConsultationSummary(schedule: WeeklySchedule): string {
  const openDays = WEEKDAY_KEYS.filter((k) => schedule[k].enabled);
  if (openDays.length === 0) return "By appointment";
  const first = schedule[openDays[0]!];
  const sameHours = openDays.every(
    (k) => schedule[k].start === first.start && schedule[k].end === first.end,
  );
  if (openDays.length === 7 && sameHours) {
    return `Daily ${formatTime12(first.start)} – ${formatTime12(first.end)}`;
  }
  if (openDays.length >= 5 && !schedule.sunday.enabled && sameHours) {
    return `Mon – Sat ${formatTime12(first.start)} – ${formatTime12(first.end)}`;
  }
  return openDays.map((k) => `${DAY_LABELS[k].slice(0, 3)} ${formatTime12(schedule[k].start)}–${formatTime12(schedule[k].end)}`).join(", ");
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((x) => parseInt(x, 10));
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatTime12(time: string): string {
  const mins = parseTimeToMinutes(time);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Overlap of branch and doctor hours for one day (booking window). */
export function intersectDaySchedules(a: DaySchedule, b: DaySchedule): DaySchedule {
  if (!a.enabled || !b.enabled) {
    return { enabled: false, start: a.start, end: a.end };
  }
  const start = Math.max(parseTimeToMinutes(a.start), parseTimeToMinutes(b.start));
  const end = Math.min(parseTimeToMinutes(a.end), parseTimeToMinutes(b.end));
  if (start >= end) {
    return { enabled: false, start: a.start, end: a.end };
  }
  return { enabled: true, start: minutesToTime(start), end: minutesToTime(end) };
}

export function generateTimeSlotsForDay(day: DaySchedule, intervalMinutes = 30): string[] {
  if (!day.enabled) return [];
  const start = parseTimeToMinutes(day.start);
  const end = parseTimeToMinutes(day.end);
  const slots: string[] = [];
  for (let t = start; t + intervalMinutes <= end; t += intervalMinutes) {
    slots.push(minutesToTime(t));
  }
  return slots;
}
