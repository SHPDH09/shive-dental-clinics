import { z } from "zod";
import { parseEmailFromSpeech } from "@/lib/voice-booking/speech-utils";

export function isValidEmailAddress(email: string): boolean {
  return z.string().email().safeParse(email.toLowerCase().trim()).success;
}

/** User is clearly dictating an email (not just saying haan). */
export function hasEmailSpeechIntent(text: string): boolean {
  const t = text.toLowerCase();
  if (t.includes("@")) return true;
  return /\b(at|gmail|yahoo|hotmail|outlook|dot com|dot in|dot|mail)\b/.test(t);
}

function findAllParsedEmails(text: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();

  const whole = parseEmailFromSpeech(text);
  if (whole) {
    const e = whole.toLowerCase();
    if (!seen.has(e)) {
      seen.add(e);
      found.push(e);
    }
  }

  const chunks = text.split(/[,;]|(?:\s{2,})/);
  for (const chunk of chunks) {
    const e = parseEmailFromSpeech(chunk);
    if (e) {
      const low = e.toLowerCase();
      if (!seen.has(low)) {
        seen.add(low);
        found.push(low);
      }
    }
  }

  return found;
}

/** Best single email from one STT utterance (prefer last complete). */
export function pickBestEmailFromSpeech(text: string): string | null {
  const candidates = findAllParsedEmails(text).filter(isValidEmailAddress);
  if (candidates.length === 0) return null;
  return candidates[candidates.length - 1] ?? null;
}

export function isCompleteEmailSpeech(text: string): boolean {
  return pickBestEmailFromSpeech(text) !== null;
}

/** Merge email fragments without duplicating repeated halves. */
function mergeEmailFragment(a: string, b: string): string {
  const x = a.trim();
  const y = b.trim();
  if (!y) return x;
  if (!x) return y;

  const eb = pickBestEmailFromSpeech(y);
  if (eb) return eb;

  const ea = pickBestEmailFromSpeech(x);
  if (ea && !hasEmailSpeechIntent(y)) return ea;

  if (y.startsWith(x) || y.includes(x)) return y;
  if (x.includes(y) && y.length >= 4) return x;

  for (let k = Math.min(x.length, y.length); k > 2; k--) {
    if (x.slice(-k).toLowerCase() === y.slice(0, k).toLowerCase()) {
      return `${x}${y.slice(k)}`;
    }
  }
  return `${x} ${y}`.trim();
}

export function mergeSpokenEmailParts(...parts: string[]): string {
  const cleaned = parts.map((p) => p.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";

  for (let i = cleaned.length - 1; i >= 0; i--) {
    const solo = pickBestEmailFromSpeech(cleaned[i]!);
    if (solo) return solo;
  }

  let acc = "";
  for (const p of cleaned) {
    acc = mergeEmailFragment(acc, p);
  }
  return pickBestEmailFromSpeech(acc) ?? acc.trim();
}

/** Live preview while speaking (may be partial). */
export function previewEmailFromSpeech(text: string): string {
  const best = pickBestEmailFromSpeech(text);
  if (best) return best;
  return text.trim().replace(/\s+/g, " ").slice(0, 64);
}
