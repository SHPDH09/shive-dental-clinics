import { addDays, format, nextDay, parseISO, startOfDay } from "date-fns";
import { devanagariDigitsToLatin } from "@/lib/voice-booking/devanagari-voice";

const EN_NUM: Record<string, string> = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
  thirteen: "13",
  fourteen: "14",
  fifteen: "15",
  sixteen: "16",
  seventeen: "17",
  eighteen: "18",
  nineteen: "19",
  twenty: "20",
  thirty: "30",
  thirtyone: "31",
  "thirty-one": "31",
};

const HI_NUM: Record<string, string> = {
  das: "10",
  gyarah: "11",
  barah: "12",
  terah: "13",
  chaudah: "14",
  pandrah: "15",
  solah: "16",
  satrah: "17",
  atharah: "18",
  unnis: "19",
  bees: "20",
  teis: "23",
  chabbis: "26",
  untis: "29",
  tees: "30",
  ikattis: "31",
};

function expandSpokenDigitsLite(text: string): string {
  let t = devanagariDigitsToLatin(text).toLowerCase();
  for (const [w, d] of Object.entries({ ...EN_NUM, ...HI_NUM })) {
    t = t.replace(new RegExp(`\\b${w.replace(/-/g, "\\-")}\\b`, "g"), d);
  }
  return t.replace(/\s+/g, " ").trim();
}

const MONTH_NAME_RE =
  /january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec/i;

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function normalizeDateSpeech(text: string): string {
  return expandSpokenDigitsLite(text)
    .toLowerCase()
    .replace(/\b(tarikh|tareek|tareh|date)\b/gi, " ")
    .replace(/\b(on|the|ko)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toIso(y: number, m: number, d: number): string | null {
  if (m < 0 || m > 11 || d < 1 || d > 31) return null;
  try {
    return format(new Date(y, m, d), "yyyy-MM-dd");
  } catch {
    return null;
  }
}

export function parseDateFromSpeech(text: string): string | null {
  const today = startOfDay(new Date());
  const mixed = normalizeDateSpeech(text);

  if (/aaj|today|now|आज/.test(mixed)) return format(today, "yyyy-MM-dd");
  if (/parso|parson|day after tomorrow|परसों|परसो/.test(mixed)) return format(addDays(today, 2), "yyyy-MM-dd");
  if (/kal|tomorrow|next day|कल/.test(mixed)) return format(addDays(today, 1), "yyyy-MM-dd");

  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  for (let i = 0; i < weekdays.length; i++) {
    const w = weekdays[i]!;
    if (new RegExp(`\\b(next\\s+)?${w}\\b|${w}\\s*ko`, "i").test(mixed)) {
      const target = nextDay(today, i as 0 | 1 | 2 | 3 | 4 | 5 | 6);
      return format(target, "yyyy-MM-dd");
    }
  }

  const iso = mixed.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];

  const dmySlash = mixed.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (dmySlash) {
    const d = parseInt(dmySlash[1]!, 10);
    const m = parseInt(dmySlash[2]!, 10) - 1;
    let y = parseInt(dmySlash[3]!, 10);
    if (y < 100) y += 2000;
    return toIso(y, m, d);
  }

  const dmySpace = mixed.match(/\b(\d{1,2})\s+(\d{1,2})\s+(\d{4})\b/);
  if (dmySpace) {
    const d = parseInt(dmySpace[1]!, 10);
    const m = parseInt(dmySpace[2]!, 10) - 1;
    const y = parseInt(dmySpace[3]!, 10);
    return toIso(y, m, d);
  }

  const resolveMonth = (name: string): number | undefined => {
    const k = name.toLowerCase();
    if (MONTHS[k] !== undefined) return MONTHS[k];
    return MONTHS[k.slice(0, 3)];
  };

  const monthPattern =
    /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b(?:\s+(\d{4}))?/i;
  const m1 = mixed.match(monthPattern);
  if (m1) {
    const day = parseInt(m1[1]!, 10);
    const mon = resolveMonth(m1[2]!);
    const y = m1[3] ? parseInt(m1[3], 10) : today.getFullYear();
    if (mon !== undefined) return toIso(y, mon, day);
  }

  const monthFirst = mixed.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:\s+(\d{4}))?\b/i,
  );
  if (monthFirst) {
    const mon = resolveMonth(monthFirst[1]!);
    const day = parseInt(monthFirst[2]!, 10);
    const y = monthFirst[3] ? parseInt(monthFirst[3], 10) : today.getFullYear();
    if (mon !== undefined) return toIso(y, mon, day);
  }

  const dmOnly = !MONTH_NAME_RE.test(mixed) ? mixed.match(/\b(\d{1,2})\s+(\d{1,2})\b/) : null;
  if (dmOnly) {
    const d = parseInt(dmOnly[1]!, 10);
    const m = parseInt(dmOnly[2]!, 10) - 1;
    if (m >= 0 && m <= 11) {
      let y = today.getFullYear();
      const candidate = new Date(y, m, d);
      if (startOfDay(candidate) < today) y += 1;
      return toIso(y, m, d);
    }
  }

  return null;
}

export function isCompleteDateSpeech(text: string): boolean {
  return parseDateFromSpeech(text) !== null;
}

export function formatDateForSpeech(isoDate: string): string {
  try {
    const d = parseISO(isoDate);
    return format(d, "d MMMM yyyy");
  } catch {
    return isoDate;
  }
}
