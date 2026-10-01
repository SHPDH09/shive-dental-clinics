import { expandSpokenDigits } from "@/lib/voice-booking/speech-utils";

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

function stripCountryPrefix(d: string): string {
  let s = d.replace(/\D/g, "");
  if (s.length === 11 && s.startsWith("0")) s = s.slice(1);
  if (s.length >= 12 && s.startsWith("91")) s = s.slice(2);
  return s;
}

/** Valid 10-digit Indian mobile inside a longer digit string. */
export function extractIndianMobileFromDigits(digits: string): string | null {
  const d = stripCountryPrefix(digits);
  if (d.length === 10 && INDIAN_MOBILE.test(d)) return d;
  for (let i = 0; i <= d.length - 10; i++) {
    const sub = d.slice(i, i + 10);
    if (INDIAN_MOBILE.test(sub)) return sub;
  }
  if (d.length > 10) {
    const last = d.slice(-10);
    if (INDIAN_MOBILE.test(last)) return last;
  }
  return null;
}

/** Speech → valid Indian mobile, or null. */
export function parseIndianMobileFromSpeech(text: string): string | null {
  const expanded = expandSpokenDigits(text);
  const digits = expanded.replace(/\D/g, "");
  return extractIndianMobileFromDigits(digits);
}

export function countPhoneDigits(text: string): number {
  return expandSpokenDigits(text).replace(/\D/g, "").length;
}

export function mergeSpokenPhoneParts(...parts: string[]): string {
  const digits = parts
    .map((p) => expandSpokenDigits(p).replace(/\D/g, ""))
    .join("");
  const mobile = extractIndianMobileFromDigits(digits);
  if (mobile) return mobile;
  return digits;
}

export function isCompletePhone(text: string): boolean {
  return parseIndianMobileFromSpeech(text) !== null;
}

export function isLikelyCompleteEmail(text: string): boolean {
  const t = text.toLowerCase().replace(/\s+/g, "");
  return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(t);
}
