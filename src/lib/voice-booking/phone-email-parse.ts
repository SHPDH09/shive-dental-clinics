import { expandSpokenDigits } from "@/lib/voice-booking/speech-utils";

export function countPhoneDigits(text: string): number {
  return expandSpokenDigits(text).replace(/\D/g, "").length;
}

export function mergeSpokenPhoneParts(...parts: string[]): string {
  const digits = parts
    .map((p) => expandSpokenDigits(p).replace(/\D/g, ""))
    .join("");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function isCompletePhone(text: string): boolean {
  return countPhoneDigits(text) >= 10;
}

export function isLikelyCompleteEmail(text: string): boolean {
  const t = text.toLowerCase().replace(/\s+/g, "");
  return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(t);
}
