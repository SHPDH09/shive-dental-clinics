"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestMicrophoneStream } from "@/lib/voice-booking/mic-permission";
import { pickBestEmailFromSpeech } from "@/lib/voice-booking/email-voice-parse";
import {
  countPhoneDigits,
  dedupeRepeatedPhoneDigits,
  isLikelyCompleteEmail,
  isCompletePhone,
  parseIndianMobileFromSpeech,
} from "@/lib/voice-booking/phone-email-parse";
import { isCompleteDateSpeech } from "@/lib/voice-booking/date-voice-parse";
import { expandSpokenDigits, isValidFutureDate, parseDateFromSpeech } from "@/lib/voice-booking/speech-utils";

type SpeechRecognitionCtor = new () => SpeechRecognition;

export type VoiceListenMode = "short" | "normal" | "phone" | "email" | "date";

const LANGS_NORMAL = ["en-IN", "hi-IN", "en-US"] as const;
const LANGS_SHORT = ["en-IN", "hi-IN", "en-US"] as const;
/** Single locale per phone listen — avoids hearing the same digits twice (en + hi). */
const LANGS_PHONE = ["hi-IN", "en-IN"] as const;
const LANGS_EMAIL = ["en-IN"] as const;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export async function ensureMicrophoneAccess(keepStream?: {
  current: MediaStream | null;
}): Promise<void> {
  const stream = await requestMicrophoneStream(keepStream);
  for (const track of stream.getTracks()) track.stop();
  if (keepStream) keepStream.current = null;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mergeTranscriptFromEvent(ev: SpeechRecognitionEvent, mode?: VoiceListenMode): string {
  if (ev.results.length === 0) return "";

  if (mode === "email" || mode === "phone" || mode === "date") {
    let best = "";
    for (let i = 0; i < ev.results.length; i++) {
      const piece = ev.results[i]?.[0]?.transcript ?? "";
      if (piece.length >= best.length) best = piece;
    }
    return best.replace(/\s+/g, " ").trim();
  }

  let finals = "";
  let interim = "";
  for (let i = 0; i < ev.results.length; i++) {
    const piece = ev.results[i]?.[0]?.transcript ?? "";
    if (ev.results[i]?.isFinal) finals += piece;
    else interim += piece;
  }
  return `${finals}${interim}`.replace(/\s+/g, " ").trim();
}

function silenceMsForMode(mode: VoiceListenMode): number {
  if (mode === "phone") return 5600;
  if (mode === "email") return 5600;
  if (mode === "date") return 5200;
  if (mode === "short") return 400;
  return 1400;
}

function dateIsoFromSpeech(text: string): string | null {
  const iso = parseDateFromSpeech(text);
  if (!iso || !isValidFutureDate(iso)) return null;
  return iso;
}

function listenWithLanguage(
  lang: string,
  maxMs: number,
  mode: VoiceListenMode,
  onInterim?: (text: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      reject(new Error("unsupported"));
      return;
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = mode === "phone" || mode === "email" || mode === "date" || mode === "normal";
    rec.maxAlternatives = 5;

    let transcript = "";
    let settled = false;
    let finalizeTimer: ReturnType<typeof setTimeout> | null = null;

    const clearFinalize = () => {
      if (finalizeTimer) {
        clearTimeout(finalizeTimer);
        finalizeTimer = null;
      }
    };

    const canCompleteEarly = (text: string): boolean => {
      if (mode === "phone") {
        const d = dedupeRepeatedPhoneDigits(expandSpokenDigits(text).replace(/\D/g, ""));
        return d.length === 10 && isCompletePhone(text);
      }
      if (mode === "email") return pickBestEmailFromSpeech(text) !== null;
      if (mode === "date") return dateIsoFromSpeech(text) !== null;
      if (mode === "short") return text.trim().length > 0;
      return false;
    };

    const scheduleFinalize = () => {
      clearFinalize();
      if (!transcript.trim()) return;
      finalizeTimer = setTimeout(() => {
        if (!settled && transcript.trim()) done(transcript);
      }, silenceMsForMode(mode));
    };

    const done = (text: string) => {
      if (settled) return;
      settled = true;
      clearFinalize();
      window.clearTimeout(timer);
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      resolve(text.trim());
    };

    const fail = (code: string) => {
      if (settled) return;
      settled = true;
      clearFinalize();
      window.clearTimeout(timer);
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      reject(new Error(code));
    };

    const timer = window.setTimeout(() => {
      if (transcript.trim()) done(transcript);
      else fail("timeout");
    }, maxMs);

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const merged = mergeTranscriptFromEvent(ev, mode);
      if (merged) transcript = merged;
      if (transcript) onInterim?.(transcript);

      if (canCompleteEarly(transcript)) {
        clearFinalize();
        done(transcript);
        return;
      }

      const last = ev.results[ev.results.length - 1];
      if (
        last?.isFinal &&
        transcript.length > 0 &&
        mode !== "phone" &&
        mode !== "email" &&
        mode !== "date"
      ) {
        done(transcript);
        return;
      }
      scheduleFinalize();
    };

    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (transcript.trim() && (ev.error === "no-speech" || ev.error === "aborted")) {
        done(transcript);
        return;
      }
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed" || ev.error === "audio-capture") {
        fail("not-allowed");
        return;
      }
      if (transcript.trim()) {
        done(transcript);
        return;
      }
      fail(ev.error || "listen_failed");
    };

    rec.onend = () => {
      if (settled) return;
      window.setTimeout(() => {
        if (settled) return;
        if (transcript.trim()) done(transcript);
        else fail("no-speech");
      }, mode === "phone" || mode === "email" || mode === "date" ? 400 : 200);
    };

    try {
      rec.start();
    } catch {
      fail("start_failed");
    }
  });
}

export async function listenForSpeech(
  maxMs: number,
  onInterim?: (text: string) => void,
  options?: { mode?: VoiceListenMode },
): Promise<string> {
  const mode = options?.mode ?? "normal";
  const short = mode === "short";
  const langs =
    mode === "phone" ? LANGS_PHONE : mode === "email" ? LANGS_EMAIL : short ? LANGS_SHORT : LANGS_NORMAL;
  const perLangMs =
    mode === "phone"
      ? Math.max(maxMs, 48000)
      : mode === "email"
        ? Math.max(maxMs, 45000)
        : mode === "date"
          ? Math.max(maxMs, 42000)
          : maxMs;

  let lastErr = "no-speech";
  let combined = "";

  for (const lang of langs) {
    try {
      const text = await listenWithLanguage(lang, perLangMs, mode, onInterim);
      combined = `${combined} ${text}`.trim();
      if (mode === "phone") {
        const solo = parseIndianMobileFromSpeech(text);
        if (solo) return text.trim();
        if (parseIndianMobileFromSpeech(combined)) return combined;
        if (combined.trim() && countPhoneDigits(combined) >= 4) return combined;
        if (text.trim()) break;
      }
      if (mode === "email") {
        const solo = pickBestEmailFromSpeech(text);
        if (solo) return text.trim();
        if (pickBestEmailFromSpeech(combined)) return combined;
        if (combined.trim() && (combined.includes("@") || /gmail|dot com|\bat\b/i.test(combined))) break;
        if (text.trim()) break;
      }
      if (mode === "date") {
        if (dateIsoFromSpeech(text)) return text.trim();
        if (dateIsoFromSpeech(combined)) return combined;
        if (isCompleteDateSpeech(combined) || isCompleteDateSpeech(text)) {
          return (combined.trim() ? combined : text).trim();
        }
        if (text.trim()) break;
      }
      if (mode !== "phone" && mode !== "email" && mode !== "date" && text.trim()) return text.trim();
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "listen_failed";
      if (lastErr === "not-allowed" || lastErr === "unsupported") throw e;
      if (combined.trim()) return combined;
      await delay(120);
    }
  }

  if (combined.trim()) return combined;
  throw new Error(lastErr);
}

export function useSpeechRecognition(_lang = "hi-IN") {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [interimText, setInterimText] = useState("");
  const cancelRef = useRef(false);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  const listenOnce = useCallback(
    (options?: { maxMs?: number; short?: boolean; mode?: VoiceListenMode }): Promise<string> => {
      const mode: VoiceListenMode =
        options?.mode ?? (options?.short ? "short" : "normal");
      const maxMs =
        options?.maxMs ??
        (mode === "phone" ? 38000 : mode === "email" ? 32000 : mode === "date" ? 36000 : 18000);
      cancelRef.current = false;
      setInterimText("");
      setListening(true);

      const task = listenForSpeech(maxMs, (t) => {
        if (!cancelRef.current) setInterimText(t);
      }, { mode });

      return task.finally(() => {
        setListening(false);
        setInterimText("");
      });
    },
    [],
  );

  const stop = useCallback(() => {
    cancelRef.current = true;
    setListening(false);
    setInterimText("");
  }, []);

  return { listenOnce, listening, stop, supported, interimText };
}
