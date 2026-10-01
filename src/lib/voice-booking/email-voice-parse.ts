import { z } from "zod";
import { collapseConsecutiveRepeats, repairStutteredEmailCompact } from "@/lib/voice-booking/email-stutter";
import { parseEmailFromSpeech } from "@/lib/voice-booking/speech-utils";

export function cleanEmailSpeechBuffer(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.includes("@")) {
    return repairStutteredEmailCompact(t.toLowerCase().replace(/\s+/g, ""));
  }
  return t;
}

const VOICE_EMAIL_TLD = /\.(com|in|co|org|net|edu|io)$/i;

export function isValidEmailAddress(email: string): boolean {
  return z.string().email().safeParse(email.toLowerCase().trim()).success;
}

/** Stricter check for STT (reject wrongtextpriya@yahoo.comextra etc.). */
export function isPlausibleVoiceEmail(email: string): boolean {
  const e = email.toLowerCase().trim();
  if (!isValidEmailAddress(e)) return false;
  const at = e.lastIndexOf("@");
  if (at <= 0) return false;
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  if (local.length > 40 || domain.length > 48) return false;
  if (!VOICE_EMAIL_TLD.test(domain)) return false;
  if (/(.{2,8})\1{2,}/.test(local)) return false;
  return true;
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

  const tryAdd = (raw: string) => {
    const e = parseEmailFromSpeech(raw);
    if (!e) return;
    const low = e.toLowerCase();
    if (seen.has(low)) return;
    seen.add(low);
    found.push(low);
  };

  tryAdd(text);
  if (text.includes("@")) {
    tryAdd(cleanEmailSpeechBuffer(text));
  }

  const chunks = text.split(/[,;]|(?:\s{2,})/);
  for (const chunk of chunks) {
    tryAdd(chunk);
    if (chunk.includes("@")) tryAdd(cleanEmailSpeechBuffer(chunk));
  }

  return found;
}

/** Best single email from one STT utterance (prefer last complete). */
export function pickBestEmailFromSpeech(text: string): string | null {
  let candidates = findAllParsedEmails(text).filter(isPlausibleVoiceEmail);
  if (candidates.length === 0) {
    candidates = findAllParsedEmails(text).filter(isValidEmailAddress);
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.length - b.length);
  return candidates[0] ?? null;
}

export function isCompleteEmailSpeech(text: string): boolean {
  const e = pickBestEmailFromSpeech(text);
  return e !== null && isPlausibleVoiceEmail(e);
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
  const partial = cleanEmailSpeechBuffer(text);
  if (partial.includes("@")) {
    const maybe = parseEmailFromSpeech(partial);
    if (maybe && isValidEmailAddress(maybe)) return maybe;
    const [local, domain] = partial.split("@");
    if (domain) return `${local?.slice(0, 32) ?? ""}@${domain.slice(0, 24)}`;
  }
  return partial.slice(0, 36) + (partial.length > 36 ? "…" : "");
}
