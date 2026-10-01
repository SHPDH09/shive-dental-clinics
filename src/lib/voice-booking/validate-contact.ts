import { z } from "zod";
import { extractIndianMobileFromDigits } from "@/lib/voice-booking/phone-email-parse";
import { parseEmailFromSpeech } from "@/lib/voice-booking/speech-utils";

export function normalizeIndianMobile(input: string): string | null {
  return extractIndianMobileFromDigits(input);
}

export function isValidIndianMobile(phone: string): boolean {
  return normalizeIndianMobile(phone) !== null;
}

export function normalizeVoiceEmail(raw: string): string | null {
  const parsed = parseEmailFromSpeech(raw);
  if (!parsed) return null;
  const cleaned = parsed.toLowerCase().trim();
  const ok = z.string().email().safeParse(cleaned);
  return ok.success ? cleaned : null;
}

/** Slow, clear TTS read-back for mobile (digit by digit). */
export function formatIndianMobileForReadback(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(-10);
  return d.split("").join(" ");
}

/** Spell email for TTS so user can verify. */
export function formatEmailForReadback(email: string): string {
  return email
    .toLowerCase()
    .replace(/@/g, " at ")
    .replace(/\./g, " dot ")
    .replace(/_/g, " underscore ");
}
