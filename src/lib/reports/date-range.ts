import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import type { DatePreset } from "@/lib/reports/types";

export const DATE_PRESET_LABELS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "last_3_months", label: "Last 3 Months" },
  { id: "this_year", label: "This Year" },
  { id: "custom", label: "Custom Range" },
];

export function resolveDateRange(
  preset: DatePreset,
  customFrom?: string,
  customTo?: string,
  now = new Date(),
): { from: Date; to: Date } {
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const d = subDays(now, 1);
      return { from: startOfDay(d), to: endOfDay(d) };
    }
    case "this_week":
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month": {
      const lm = subMonths(now, 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm) };
    }
    case "last_3_months":
      return { from: startOfDay(subMonths(now, 3)), to: endOfDay(now) };
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "custom": {
      const from = customFrom ? startOfDay(new Date(customFrom)) : startOfMonth(now);
      const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
      if (from.getTime() > to.getTime()) {
        return { from: to, to: from };
      }
      return { from, to };
    }
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

export function formatRangeLabel(from: Date, to: Date): string {
  return `${from.toISOString().slice(0, 10)} – ${to.toISOString().slice(0, 10)}`;
}
