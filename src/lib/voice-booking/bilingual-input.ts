/** Accept Hindi, English, or mixed voice input across booking steps. */

import { parseDevanagariName } from "@/lib/voice-booking/devanagari-voice";

function normalizeTranscript(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

const FILLER_PREFIX =
  /^(ji|hello|hey|ok|okay|please|plz|so|umm|uh|mera|meri|my|the|naam|name|is|hai|hoon|hu|i am|i'm|this is|it's|it is|yeh|ye|main|mai|mein)\s+/gi;

export function normalizeVoiceInput(raw: string): string {
  let t = normalizeTranscript(raw);
  for (let i = 0; i < 4; i++) {
    const next = t.replace(FILLER_PREFIX, "").trim();
    if (next === t) break;
    t = next;
  }
  return t.trim();
}

export function parseNameFromSpeech(raw: string): string {
  let t = normalizeVoiceInput(raw);
  t = t.replace(/\b(naam|name|hai|hoon|hu|ji|is)\b/gi, " ").replace(/\s+/g, " ").trim();
  if (/[\u0900-\u097F]/.test(raw)) {
    const hi = parseDevanagariName(raw);
    if (hi.length >= 2) return hi;
  }
  return t;
}
