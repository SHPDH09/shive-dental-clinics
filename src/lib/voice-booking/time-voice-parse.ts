import { devanagariDigitsToLatin } from "@/lib/voice-booking/devanagari-voice";

function expandSpokenDigitsLite(text: string): string {
  return devanagariDigitsToLatin(text).toLowerCase();
}

const HI_HOUR: Record<string, number> = {
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  paanch: 5,
  panch: 5,
  chhe: 6,
  che: 6,
  saat: 7,
  aath: 8,
  ath: 8,
  nau: 9,
  das: 10,
  gyarah: 11,
  barah: 12,
};

function hourFromWord(word: string): number | null {
  const n = parseInt(word, 10);
  if (!Number.isNaN(n)) return n;
  return HI_HOUR[word.toLowerCase()] ?? null;
}

function normalizeTimeSpeech(text: string): string {
  return expandSpokenDigitsLite(text)
    .toLowerCase()
    .replace(/\ba\.?\s*m\.?\b/g, " am ")
    .replace(/\bp\.?\s*m\.?\b/g, " pm ")
    .replace(/\s+/g, " ")
    .trim();
}

function pack(h: number, min: number): string {
  const hh = Math.max(0, Math.min(23, h));
  const mm = Math.max(0, Math.min(59, min));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function isPmContext(t: string): boolean {
  return /\b(pm|p m|dopahar|shaam|sham|evening|night|raat|afternoon)\b/.test(t);
}

function isAmContext(t: string): boolean {
  return /\b(am|a m|subah|morning|savere)\b/.test(t);
}

export function parseTimeFromSpeech(text: string): string | null {
  const t = normalizeTimeSpeech(text);

  const apExplicit = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (apExplicit) {
    let h = parseInt(apExplicit[1]!, 10);
    const min = apExplicit[2] ? parseInt(apExplicit[2], 10) : 0;
    const ap = apExplicit[3]!.toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return pack(h, min);
  }

  const baje = t.match(
    /\b(\d{1,2}|ek|do|teen|char|paanch|panch|chhe|che|saat|aath|ath|nau|das|gyarah|barah)\s*baje\b/,
  );
  if (baje) {
    let h = hourFromWord(baje[1]!) ?? 10;
    if (isAmContext(t) && h === 12) h = 0;
    else if (isPmContext(t) && h < 12) h += 12;
    else if (!isAmContext(t) && !isPmContext(t) && h >= 1 && h <= 8) h += 12;
    return pack(h, 0);
  }

  const saadhe = t.match(
    /saadhe\s+(\d{1,2}|ek|do|teen|char|paanch|panch|chhe|che|saat|aath|ath|nau|das|gyarah|barah)/,
  );
  if (saadhe) {
    let h = hourFromWord(saadhe[1]!) ?? 10;
    if (isPmContext(t) && h < 12) h += 12;
    if (isAmContext(t) && h === 12) h = 0;
    return pack(h, 30);
  }

  const m24 = t.match(/\b(\d{1,2}):(\d{2})\b/);
  if (m24) {
    return pack(parseInt(m24[1]!, 10), parseInt(m24[2]!, 10));
  }

  return null;
}

/** 24h HH:mm → "3:30 PM" for TTS / confirm. */
export function formatTime12Hour(time24: string): string {
  const [hs, ms] = time24.split(":");
  let h = parseInt(hs ?? "0", 10);
  const min = (ms ?? "00").padStart(2, "0");
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${min} ${suffix}`;
}
