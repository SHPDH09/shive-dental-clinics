import { isCompleteEmailSpeech } from "@/lib/voice-booking/email-voice-parse";
import { expandSpokenDigits } from "@/lib/voice-booking/speech-utils";

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

function stripCountryPrefix(d: string): string {
  let s = d.replace(/\D/g, "");
  if (s.length === 11 && s.startsWith("0")) s = s.slice(1);
  if (s.length >= 12 && s.startsWith("91")) s = s.slice(2);
  return s;
}

/** Remove STT stutter: same 10 digits repeated back-to-back. */
export function dedupeRepeatedPhoneDigits(digits: string): string {
  const s = digits.replace(/\D/g, "");
  if (s.length === 20 && s.slice(0, 10) === s.slice(10, 20)) return s.slice(0, 10);
  const m = s.match(/^(\d{10})\1+$/);
  if (m) return m[1];
  return s;
}

/** Join digit strings with suffix/prefix overlap (paused speech). */
export function mergePhoneDigitStrings(a: string, b: string): string {
  const x = a.replace(/\D/g, "");
  const y = b.replace(/\D/g, "");
  if (!y) return x;
  if (!x) return y;
  if (y.startsWith(x)) return y;
  if (x.endsWith(y)) return x;
  if (x.includes(y) && y.length >= 6) return x;
  if (y.includes(x) && x.length >= 6) return y;
  for (let k = Math.min(x.length, y.length); k > 0; k--) {
    if (x.slice(-k) === y.slice(0, k)) return x + y.slice(k);
  }
  return x + y;
}

function allValidIndianMobiles(d: string): string[] {
  const found: string[] = [];
  for (let i = 0; i <= d.length - 10; i++) {
    const sub = d.slice(i, i + 10);
    if (INDIAN_MOBILE.test(sub)) found.push(sub);
  }
  return found;
}

/** Pick best 10-digit mobile from a longer digit string (prefer last heard). */
export function pickBestIndianMobileFromDigits(digits: string): string | null {
  let d = dedupeRepeatedPhoneDigits(stripCountryPrefix(digits));
  if (d.length === 10 && INDIAN_MOBILE.test(d)) return d;
  const candidates = allValidIndianMobiles(d);
  if (candidates.length === 0) {
    if (d.length > 10) {
      const last = d.slice(-10);
      if (INDIAN_MOBILE.test(last)) return last;
    }
    return null;
  }
  return candidates[candidates.length - 1] ?? null;
}

/** Valid 10-digit Indian mobile inside a longer digit string. */
export function extractIndianMobileFromDigits(digits: string): string | null {
  return pickBestIndianMobileFromDigits(digits);
}

/** Speech → valid Indian mobile, or null. */
export function parseIndianMobileFromSpeech(text: string): string | null {
  const expanded = expandSpokenDigits(text);
  const digits = expanded.replace(/\D/g, "");
  return pickBestIndianMobileFromDigits(digits);
}

export function countPhoneDigits(text: string): number {
  return expandSpokenDigits(text).replace(/\D/g, "").length;
}

export function hasEnoughPhoneDigitsInSpeech(text: string, min = 6): boolean {
  return countPhoneDigits(text) >= min;
}

export function mergeSpokenPhoneParts(...parts: string[]): string {
  const cleaned = parts.map((p) => p.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";

  for (let i = cleaned.length - 1; i >= 0; i--) {
    const solo = parseIndianMobileFromSpeech(cleaned[i]!);
    if (solo) return solo;
  }

  let acc = "";
  for (const p of cleaned) {
    const d = expandSpokenDigits(p).replace(/\D/g, "");
    acc = mergePhoneDigitStrings(acc, d);
  }
  acc = dedupeRepeatedPhoneDigits(acc);
  const mobile = pickBestIndianMobileFromDigits(acc);
  if (mobile) return mobile;
  return acc;
}

export function isCompletePhone(text: string): boolean {
  const d = expandSpokenDigits(text).replace(/\D/g, "");
  const deduped = dedupeRepeatedPhoneDigits(d);
  if (deduped.length === 10 && INDIAN_MOBILE.test(deduped)) return true;
  return parseIndianMobileFromSpeech(text) !== null && countPhoneDigits(text) === 10;
}

export function isLikelyCompleteEmail(text: string): boolean {
  return isCompleteEmailSpeech(text);
}

/** Live preview while user is speaking (may be partial). */
export function previewPhoneDigitsFromSpeech(text: string): string {
  const d = dedupeRepeatedPhoneDigits(expandSpokenDigits(text).replace(/\D/g, ""));
  return d.slice(0, 10);
}
