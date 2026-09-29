import { endOfDay, parseISO, startOfDay, subDays } from "date-fns";

export type DashboardDateRange = {
  from: Date;
  to: Date;
  fromIso: string;
  toIso: string;
};

export function parseDashboardDateRange(
  fromParam: string | null,
  toParam: string | null,
): DashboardDateRange {
  const today = endOfDay(new Date());
  const to = toParam?.trim()
    ? endOfDay(parseISO(toParam.trim()))
    : today;
  const from = fromParam?.trim()
    ? startOfDay(parseISO(fromParam.trim()))
    : startOfDay(subDays(to, 29));

  const safeFrom = from.getTime() <= to.getTime() ? from : startOfDay(to);
  const safeTo = to;

  return {
    from: safeFrom,
    to: safeTo,
    fromIso: safeFrom.toISOString().slice(0, 10),
    toIso: safeTo.toISOString().slice(0, 10),
  };
}
