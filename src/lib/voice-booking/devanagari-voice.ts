/** Hindi (Devanagari) speech-to-text normalizers for voice booking. */

const DEVANAGARI_DIGIT: Record<string, string> = {
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
};

export function devanagariDigitsToLatin(text: string): string {
  return text.replace(/[०-९]/g, (ch) => DEVANAGARI_DIGIT[ch] ?? ch);
}

export function containsDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/** Normalize STT output like हं, हाँ, जी → intent tokens. */
export function normalizeDevanagariIntent(raw: string): string {
  let t = raw.replace(/\s+/g, " ").trim();
  if (!t) return t;

  t = devanagariDigitsToLatin(t);

  const compact = t.replace(/\s+/g, "");
  const yesOnly =
    /^(हं|हँ|हाँ|हां|हा|हान|हाँजी|जीहाँ|जी|बिल्कुल|ठीक|सही|हाँबोलिए|हांबोलिए|ठीकहै|सहीहै)$/u;
  const noOnly = /^(नहीं|नही|ना|न|मत|रद्द|गलत)$/u;

  if (yesOnly.test(compact)) return "haan";
  if (noOnly.test(compact)) return "nahi";

  if (/नहीं|नही|^\s*ना\s*$|^\s*न\s*$|मत\b|रद्द|गलत/u.test(t)) return "nahi";

  if (
    /हं|हँ|हाँ|हां|\bहा\b|जी|बिल्कुल|ठीक|सही|चाह|बुक|अपॉइंट|appointment|confirm/iu.test(t) &&
    !/नहीं|नही/u.test(t)
  ) {
    return "haan";
  }

  return t;
}

/** Strip common Hindi fillers from names (Devanagari + roman). */
export function parseDevanagariName(raw: string): string {
  let t = raw.replace(/\s+/g, " ").trim();
  t = t.replace(/^(ji|hello|mera|meri|my|naam|name|is|hai|hoon|hu|मेरा|मेरी|नाम|है|हूँ|हूं|जी)\s+/giu, "").trim();
  for (let i = 0; i < 4; i++) {
    const next = t.replace(/^(ji|mera|meri|naam|name|hai|मेरा|मेरी|नाम|है|जी)\s+/giu, "").trim();
    if (next === t) break;
    t = next;
  }
  return t.replace(/\s+(hai|hoon|hu|है|हूँ|हूं|जी)$/giu, "").trim();
}
