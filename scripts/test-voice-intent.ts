import assert from "node:assert/strict";
import {
  isAffirmative,
  isNegative,
  normalizeIntentSpeech,
} from "../src/lib/voice-booking/speech-utils";

const yesSamples = ["ha", "haa", "han", "haan", "Haan", "yes", "ji", "ha bolta hu", "appointment book karna chahte hain"];
for (const s of yesSamples) {
  const n = normalizeIntentSpeech(s);
  assert.equal(isAffirmative(n), true, `expected yes: ${s} -> ${n}`);
}

const noSamples = ["nahi", "na", "no", "mat"];
for (const s of noSamples) {
  assert.equal(isNegative(normalizeIntentSpeech(s)), true, `expected no: ${s}`);
}

assert.equal(isAffirmative(normalizeIntentSpeech("hot")), true, "hot -> haan");
assert.equal(isAffirmative(normalizeIntentSpeech("heart")), true, "heart -> haan");
assert.equal(isAffirmative(normalizeIntentSpeech("हं")), true, "devanagari ham");

console.log("voice-intent: all checks passed");
