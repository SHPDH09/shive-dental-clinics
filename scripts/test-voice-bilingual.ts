import assert from "node:assert/strict";
import { parseNameFromSpeech } from "../src/lib/voice-booking/bilingual-input";
import { extractIndianMobileFromDigits, mergeSpokenPhoneParts } from "../src/lib/voice-booking/phone-email-parse";
import {
  normalizeIndianMobile,
  normalizeVoiceEmail,
} from "../src/lib/voice-booking/validate-contact";
import {
  isAffirmative,
  normalizeIntentSpeech,
  parseDateFromSpeech,
  parseEmailFromSpeech,
  parsePhoneFromSpeech,
  parseTimeFromSpeech,
} from "../src/lib/voice-booking/speech-utils";

assert.equal(parseNameFromSpeech("my name is Rahul Kumar"), "Rahul Kumar");
assert.equal(parseNameFromSpeech("mera naam Priya hai"), "Priya");
assert.equal(parsePhoneFromSpeech("nine eight seven six five four three two one zero"), "9876543210");
assert.equal(parsePhoneFromSpeech("nine eight seven six five four"), null);
assert.equal(mergeSpokenPhoneParts("98765", "43210"), "9876543210");
assert.equal(parseEmailFromSpeech("rahul at g mail dot com")?.includes("gmail"), true);
assert.equal(parseEmailFromSpeech("rahul at gmail dot com")?.includes("@"), true);
assert.ok(parseDateFromSpeech("tomorrow"));
assert.ok(parseDateFromSpeech("kal"));
assert.equal(parseTimeFromSpeech("subah das baje"), "10:00");
assert.equal(parseTimeFromSpeech("10 AM")?.startsWith("10"), true);
assert.equal(isAffirmative(normalizeIntentSpeech("han ji yes book karna hai")), true);
assert.equal(normalizeIntentSpeech("हं"), "haan");
assert.equal(normalizeIntentSpeech("हाँ"), "haan");
assert.equal(normalizeIntentSpeech("हां"), "haan");
assert.equal(normalizeIntentSpeech("जी"), "haan");
assert.equal(normalizeIntentSpeech("नहीं"), "nahi");
assert.equal(isAffirmative(normalizeIntentSpeech("हं")), true);
assert.equal(parsePhoneFromSpeech("९८७६५४३२१०"), "9876543210");
assert.equal(parsePhoneFromSpeech("5876543210 extra noise"), null);
assert.equal(extractIndianMobileFromDigits("919876543210"), "9876543210");
assert.equal(normalizeIndianMobile("98 76 54 32 10"), "9876543210");
assert.equal(normalizeIndianMobile("5876543210"), null);
assert.equal(normalizeVoiceEmail("rahul at gmail dot com"), "rahul@gmail.com");
assert.equal(normalizeVoiceEmail("not an email"), null);

console.log("voice-bilingual: all checks passed");
