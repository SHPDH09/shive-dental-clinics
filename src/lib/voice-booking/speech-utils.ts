import { addDays, format, parseISO, startOfDay } from "date-fns";
import {
  devanagariDigitsToLatin,
  normalizeDevanagariIntent,
} from "@/lib/voice-booking/devanagari-voice";
import { repairStutteredEmailCompact } from "@/lib/voice-booking/email-stutter";
import { extractIndianMobileFromDigits } from "@/lib/voice-booking/phone-email-parse";
import { isLikelyMaleVoice, pickFemaleTtsVoice } from "@/lib/voice-booking/pick-tts-voice";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Stop TTS and wait before opening the mic (avoids echo / instant no-speech). */
export async function waitForMicHandoff(): Promise<void> {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
  for (let i = 0; i < 80; i++) {
    if (!window.speechSynthesis?.speaking) break;
    await delay(50);
  }
  await delay(520);
}

function applyNaturalVoice(u: SpeechSynthesisUtterance, lang: string) {
  u.lang = lang;
  u.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const picked = pickFemaleTtsVoice(voices, lang);
  if (picked) {
    u.voice = picked;
    u.lang = picked.lang || lang;
  }
  if (isLikelyMaleVoice(picked)) {
    u.pitch = 1.08;
  } else {
    u.pitch = 0.98;
  }
}

export function speakText(text: string, lang = "hi-IN"): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();

    const speak = () => {
      const u = new SpeechSynthesisUtterance(text);
      applyNaturalVoice(u, lang);
      u.onend = () => setTimeout(resolve, 280);
      u.onerror = () => setTimeout(resolve, 280);
      window.speechSynthesis.speak(u);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speak();
      };
      setTimeout(speak, 120);
    } else {
      speak();
    }
  });
}

/** Speak like a person: short lines with brief pauses between them. */
export async function speakConversation(parts: string[], lang = "hi-IN"): Promise<void> {
  for (const line of parts) {
    const t = line.trim();
    if (!t) continue;
    await speakText(t, lang);
    await delay(380);
  }
}

export function unmuteMicStream(stream: MediaStream | null | undefined): void {
  stream?.getAudioTracks().forEach((track) => {
    track.enabled = true;
  });
}

/** Mute mic between questions (stream stays open — no extra permission prompt). */
export function muteMicStream(stream: MediaStream | null | undefined): void {
  stream?.getAudioTracks().forEach((track) => {
    track.enabled = false;
  });
}

export function normalizeTranscript(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

const EN_WORD_DIGIT: Record<string, string> = {
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
  oh: "0",
};

const HI_WORD_DIGIT: Record<string, string> = {
  shunya: "0",
  ek: "1",
  do: "2",
  teen: "3",
  char: "4",
  paanch: "5",
  panch: "5",
  chhe: "6",
  che: "6",
  saat: "7",
  aath: "8",
  ath: "8",
  nau: "9",
};

export function expandSpokenDigits(text: string): string {
  let t = devanagariDigitsToLatin(text).toLowerCase();
  t = t
    .replace(/\b(plus|country code)\s*(nine one|91|nine\s*one)\b/gi, "91 ")
    .replace(/\b(mobile|phone|number|no\.?|mera|meri)\b/gi, " ")
    .replace(/\b(double|dubble)\s+(\w+)\b/gi, (_, w) => `${w} ${w}`)
    .replace(/\b(triple|treble)\s+(\w+)\b/gi, (_, w) => `${w} ${w} ${w}`)
    .replace(/\bzero\b|\bsifar\b|\bsifra\b|\bshunya\b/gi, "0");
  for (const [word, digit] of Object.entries(EN_WORD_DIGIT)) {
    t = t.replace(new RegExp(`\\b${word}\\b`, "g"), digit);
  }
  for (const [word, digit] of Object.entries(HI_WORD_DIGIT)) {
    t = t.replace(new RegExp(`\\b${word}\\b`, "g"), digit);
  }
  return t.replace(/\s+/g, " ").trim();
}

/** Map common STT mis-hears for haan / nahi (Roman + Devanagari). */
export function normalizeIntentSpeech(raw: string): string {
  let t = normalizeTranscript(raw);
  const dev = normalizeDevanagariIntent(t);
  if (dev === "haan" || dev === "nahi") return dev;

  t = t.toLowerCase();
  t = t.replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim();
  if (/^(ha|haa|han|hann|hun|hum|ho|hot|heart|hut|hah)$/i.test(t)) return "haan";
  if (/^(ya|yaa|ye|yep|yeah|yes|y)$/i.test(t)) return "yes";
  if (/^(na|nahi|nah|no|nope|mat)$/i.test(t)) return "nahi";
  if (/\b(nahi|nah|no|nope|mat|cancel|galat)\b/.test(t)) return "nahi";
  if (/\b(haan|han|ha|yes|yeah|yep|ji|ok|okay|bilkul|theek|sahi|confirm|book|chahte|chahiye|chahie)\b/.test(t)) {
    return "haan";
  }
  return t;
}

export function parsePhoneFromSpeech(text: string): string | null {
  const expanded = expandSpokenDigits(text);
  const digits = expanded.replace(/\D/g, "");
  return extractIndianMobileFromDigits(digits);
}

export function parseEmailFromSpeech(text: string): string | null {
  let t = text.toLowerCase().replace(/\s+/g, " ").trim();
  t = t
    .replace(/\bg\s*mail\b|\bji\s*mail\b|\bjeemel\b/gi, "gmail")
    .replace(/\by\s*mail\b/gi, "ymail")
    .replace(/\boutlook\b/gi, "outlook")
    .replace(/\byahoo\b/gi, "yahoo")
    .replace(/\bhotmail\b/gi, "hotmail")
    .replace(/\brediff\s*mail\b/gi, "rediffmail")
    .replace(/\b(wrong|text|extra|noise|hello|hi|ji|please|bol|bolo|mera|meri)\b/gi, " ")
    .replace(/\bemel\b|\be\s*mail\b|\bemail\b|\bee mail\b|\bmail id\b/gi, " ")
    .replace(/\bat the rate\b|\battherate\b|\bat rate\b|\baterate\b/gi, "@")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\bdot com\b/gi, ".com")
    .replace(/\bdot in\b/gi, ".in")
    .replace(/\bdot co\b/gi, ".co")
    .replace(/\bdot\b|\bpoint\b/gi, ".")
    .replace(/\bunderscore\b/gi, "_")
    .replace(/\s+/g, "");
  t = repairStutteredEmailCompact(t);
  const matches = [
    ...t.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.(?:com|in|co|org|net|edu|io)\b/gi),
  ].map((m) => m[0]);
  if (matches.length > 0) {
    matches.sort((a, b) => a.length - b.length);
    return matches[0] ?? null;
  }
  return null;
}

export function parseDateFromSpeech(text: string): string | null {
  const t = text.toLowerCase().trim();
  const today = startOfDay(new Date());

  const mixed = devanagariDigitsToLatin(t);
  if (/aaj|today|now|आज/.test(mixed)) return format(today, "yyyy-MM-dd");
  if (/parso|parson|day after tomorrow|परसों|परसो/.test(mixed)) return format(addDays(today, 2), "yyyy-MM-dd");
  if (/kal|tomorrow|next day|कल/.test(mixed)) return format(addDays(today, 1), "yyyy-MM-dd");

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

function hourFromHindiWord(word: string): number | null {
  return HI_HOUR[word.toLowerCase()] ?? null;
}

export function parseTimeFromSpeech(text: string): string | null {
  let t = expandSpokenDigits(text.toLowerCase()).replace(/\s+/g, " ");

  const baje = t.match(/\b(\d{1,2}|ek|do|teen|char|paanch|panch|chhe|che|saat|aath|ath|nau|das|gyarah|barah)\s*baje\b/);
  if (baje) {
    let h = parseInt(baje[1], 10);
    if (Number.isNaN(h)) h = hourFromHindiWord(baje[1]) ?? 10;
    if (/dopahar|shaam|sham|evening|pm|night/.test(t) && h < 12) h += 12;
    if (/subah|morning|am/.test(t) && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:00`;
  }

  const saadhe = t.match(/saadhe\s+(\d{1,2}|ek|do|teen|char|paanch|panch|chhe|che|saat|aath|ath|nau|das|gyarah|barah)/);
  if (saadhe) {
    let h = parseInt(saadhe[1], 10);
    if (Number.isNaN(h)) h = hourFromHindiWord(saadhe[1]) ?? 10;
    if (/dopahar|shaam|sham|evening|pm/.test(t) && h < 12) h += 12;
    return `${String(h).padStart(2, "0")}:30`;
  }

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
  const t = normalizeIntentSpeech(text);
  if (!t) return false;
  if (isNegative(t)) return false;
  if (/^(yes|yeah|yep|ok|okay|confirm|book|haan|han|ji|theek|thik|sahi|correct|bilkul|zaroor|please|ha)/.test(t)) {
    return true;
  }
  return /\b(haan|ha|han|ji|yes|book|appointment|chahte|chahiye|chahie|karna chahte|bilkul|theek hai|kar|karna)\b/.test(t);
}

export function isNegative(text: string): boolean {
  const t = normalizeIntentSpeech(text);
  return /^(no|nope|cancel|nahi|nah|mat|wrong|galat)/.test(t) || t === "nahi";
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
    const score = words.filter((w) => w.length > 2 && t.includes(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { ...s, score };
  }
  if (!best && t.trim().length >= 2) {
    return { id: "", name: t.trim() };
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
