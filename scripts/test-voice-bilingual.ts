import assert from "node:assert/strict";
import { parseNameFromSpeech } from "../src/lib/voice-booking/bilingual-input";
import {
  dedupeRepeatedPhoneDigits,
  extractIndianMobileFromDigits,
  isCompletePhone,
  mergePhoneDigitStrings,
  mergeSpokenPhoneParts,
  parseIndianMobileFromSpeech,
} from "../src/lib/voice-booking/phone-email-parse";
import { collapseConsecutiveRepeats } from "../src/lib/voice-booking/email-stutter";
import {
  cleanEmailSpeechBuffer,
  mergeSpokenEmailParts,
  pickBestEmailFromSpeech,
} from "../src/lib/voice-booking/email-voice-parse";
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
assert.equal(parseTimeFromSpeech("10 AM"), "10:00");
assert.equal(parseTimeFromSpeech("3 PM"), "15:00");
assert.equal(parseTimeFromSpeech("3 p.m."), "15:00");
assert.ok(parseDateFromSpeech("5 october"));
assert.ok(parseDateFromSpeech("10 october"));
assert.ok(parseDateFromSpeech("5 september"));
assert.ok(parseDateFromSpeech("05/10/2025"));
assert.ok(parseDateFromSpeech("5.5.2026"));
assert.equal(parseDateFromSpeech("10"), null);
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
assert.equal(parseIndianMobileFromSpeech("plus nine one nine eight seven six five four three two one zero"), "9876543210");
assert.equal(parseIndianMobileFromSpeech("mera mobile nine eight seven six five four three two one zero"), "9876543210");
assert.equal(isCompletePhone("nine eight seven six five four three two one"), false);
assert.equal(normalizeIndianMobile("98 76 54 32 10"), "9876543210");
assert.equal(normalizeIndianMobile("5876543210"), null);
assert.equal(normalizeVoiceEmail("rahul at gmail dot com"), "rahul@gmail.com");
assert.equal(normalizeVoiceEmail("not an email"), null);
assert.equal(dedupeRepeatedPhoneDigits("98765432109876543210"), "9876543210");
assert.equal(mergePhoneDigitStrings("98765", "43210"), "9876543210");
assert.equal(
  mergeSpokenPhoneParts("62066 wrong", "nine eight seven six five four three two one zero"),
  "9876543210",
);
assert.equal(mergeSpokenPhoneParts("9876543210", "9876543210"), "9876543210");
assert.equal(pickBestEmailFromSpeech("rahul at gmail dot com"), "rahul@gmail.com");
assert.equal(
  mergeSpokenEmailParts("rahul at", "gmail dot com"),
  "rahul@gmail.com",
);
assert.equal(
  mergeSpokenEmailParts("rahul at gmail dot com", "rahul at gmail dot com"),
  "rahul@gmail.com",
);
assert.equal(
  pickBestEmailFromSpeech("wrong text priya at yahoo dot com extra"),
  "priya@yahoo.com",
);
const stutter =
  "raunakraunakkumarraunakkumarjobraunakkumarraunakkumarraunakkumarraunakkumarjob@gmail.com";
assert.ok(collapseConsecutiveRepeats(stutter.split("@")[0]!).length < 30);
const fixed = pickBestEmailFromSpeech(stutter);
assert.ok(fixed && fixed.includes("@gmail.com") && fixed.length < 40, fixed ?? "null");
assert.equal(
  pickBestEmailFromSpeech("raunak kumar job at gmail dot com"),
  "raunakkumarjob@gmail.com",
);

console.log("voice-bilingual: all checks passed");
