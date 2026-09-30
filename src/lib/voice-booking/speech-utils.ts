import { addDays, format, parseISO, startOfDay } from "date-fns";

export function speakText(text: string, lang = "en-IN"): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.95;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export function normalizeTranscript(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function parsePhoneFromSpeech(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 10) {
    const ten = digits.slice(-10);
    return ten;
  }
  return null;
}

export function parseEmailFromSpeech(text: string): string | null {
  let t = text.toLowerCase().replace(/\s+/g, "");
  t = t.replace(/atthe/g, "@").replace(/at/g, "@").replace(/dot/g, ".");
  const m = t.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0] : null;
}

export function parseDateFromSpeech(text: string): string | null {
  const t = text.toLowerCase().trim();
  const today = startOfDay(new Date());

  if (/aaj|today|now/.test(t)) return format(today, "yyyy-MM-dd");
  if (/kal|tomorrow|next day/.test(t)) return format(addDays(today, 1), "yyyy-MM-dd");

  const iso = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];

  const dmy = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmy) {
    const d = parseInt(dmy[1], 10);
    const m = parseInt(dmy[2], 10);
    let y = parseInt(dmy[3], 10);
    if (y < 100) y += 2000;
    try {
      return format(new Date(y, m - 1, d), "yyyy-MM-dd");
    } catch {
      /* ignore */
    }
  }

  const spoken = t.match(/(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
  if (spoken) {
    const months: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const day = parseInt(spoken[1], 10);
    const mon = months[spoken[2].slice(0, 3).toLowerCase()];
    if (mon !== undefined) {
      const y = today.getFullYear();
      return format(new Date(y, mon, day), "yyyy-MM-dd");
    }
  }

  return null;
}

export function parseTimeFromSpeech(text: string): string | null {
  const t = text.toLowerCase().replace(/\s+/g, " ");
  const m24 = t.match(/\b(\d{1,2}):(\d{2})\b/);
  if (m24) {
    const h = Math.min(23, parseInt(m24[1], 10));
    const min = Math.min(59, parseInt(m24[2], 10));
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  const m12 = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m|p\.m|baje)?/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = m12[2] ? parseInt(m12[2], 10) : 0;
    const ap = m12[3]?.toLowerCase();
    if (ap?.startsWith("p") && h < 12) h += 12;
    if (ap?.startsWith("a") && h === 12) h = 0;
    if (!ap && h <= 8) h += 12;
    if (h > 23) h = 12;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  return null;
}

export function isAffirmative(text: string): boolean {
  const t = text.toLowerCase();
  return /^(yes|yeah|yep|ok|okay|confirm|book|ha|haan|han|ji|theek|thik|sahi|correct)/.test(t.trim());
}

export function isNegative(text: string): boolean {
  const t = text.toLowerCase();
  return /^(no|nope|cancel|nahi|nah|mat|wrong|galat)/.test(t.trim());
}

export function matchServiceName(transcript: string, services: { id: string; name: string }[]): {
  id: string;
  name: string;
} | null {
  const t = transcript.toLowerCase();
  const num = t.match(/\b(\d{1,2})\b/);
  if (num) {
    const idx = parseInt(num[1], 10) - 1;
    if (idx >= 0 && idx < services.length) return services[idx];
  }
  let best: { id: string; name: string; score: number } | null = null;
  for (const s of services) {
    const n = s.name.toLowerCase();
    if (t.includes(n) || n.includes(t)) return s;
    const words = n.split(/\s+/);
    const score = words.filter((w) => w.length > 3 && t.includes(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { ...s, score };
  }
  return best;
}

export function isValidFutureDate(isoDate: string): boolean {
  try {
    const d = parseISO(isoDate);
    return startOfDay(d).getTime() >= startOfDay(new Date()).getTime();
  } catch {
    return false;
  }
}
