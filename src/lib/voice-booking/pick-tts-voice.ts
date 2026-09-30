/** Prefer a natural female voice for clinic assistant prompts (browser TTS). */

const FEMALE_HINT =
  /\b(female|woman|swara|lekha|heera|priya|neerja|kavya|sapna|aditi|meera|veena|zira|samantha|karen|tessa|fiona|hindi\s*female|google\s.*female)/i;
const MALE_HINT =
  /\b(male|man|rishi|madhur|amit|deepak|raj|david|mark|james|hindi\s*male|google\s.*male)/i;

function genderScore(label: string): number {
  if (FEMALE_HINT.test(label)) return 3;
  if (MALE_HINT.test(label)) return -3;
  return 0;
}

function langScore(voiceLang: string, preferLang: string): number {
  const want = preferLang.toLowerCase();
  const have = voiceLang.toLowerCase();
  if (have === want) return 4;
  const wantBase = want.split("-")[0] ?? want;
  if (have.startsWith(wantBase)) return 3;
  if (have.includes("in")) return 1;
  return 0;
}

function scoreVoice(v: SpeechSynthesisVoice, preferLang: string): number {
  const fromName = genderScore(v.name);
  const fromUri = genderScore(v.voiceURI ?? "");
  const lang = langScore(v.lang, preferLang);
  return lang * 10 + fromName + fromUri;
}

export function pickFemaleTtsVoice(
  voices: SpeechSynthesisVoice[],
  preferLang = "hi-IN",
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const ranked = [...voices].sort((a, b) => scoreVoice(b, preferLang) - scoreVoice(a, preferLang));
  const best = ranked[0] ?? null;
  if (!best) return null;

  const bestGender = genderScore(best.name) + genderScore(best.voiceURI ?? "");
  if (bestGender >= 0) return best;

  const femaleInLang = voices.find((v) => {
    const g = genderScore(v.name) + genderScore(v.voiceURI ?? "");
    return g > 0 && langScore(v.lang, preferLang) >= 2;
  });
  if (femaleInLang) return femaleInLang;

  const anyFemale = voices.find((v) => genderScore(v.name) + genderScore(v.voiceURI ?? "") > 0);
  return anyFemale ?? best;
}

export function isLikelyMaleVoice(voice: SpeechSynthesisVoice | null): boolean {
  if (!voice) return false;
  return genderScore(voice.name) + genderScore(voice.voiceURI ?? "") < 0;
}
