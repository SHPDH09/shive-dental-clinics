"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestMicrophoneStream } from "@/lib/voice-booking/mic-permission";
import { isLikelyCompleteEmail, isCompletePhone } from "@/lib/voice-booking/phone-email-parse";

type SpeechRecognitionCtor = new () => SpeechRecognition;

export type VoiceListenMode = "short" | "normal" | "phone" | "email";

const LANGS_NORMAL = ["en-IN", "hi-IN", "en-US"] as const;
const LANGS_SHORT = ["en-IN", "hi-IN", "en-US"] as const;
const LANGS_DIGITS = ["en-IN", "hi-IN"] as const;

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

function mergeTranscriptFromEvent(ev: SpeechRecognitionEvent): string {
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
  if (mode === "phone" || mode === "email") return 2600;
  if (mode === "short") return 400;
  return 1400;
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
    rec.continuous = mode === "phone" || mode === "email" || mode === "normal";
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
      if (mode === "phone") return isCompletePhone(text);
      if (mode === "email") return isLikelyCompleteEmail(text);
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
      const merged = mergeTranscriptFromEvent(ev);
      if (merged) transcript = merged;
      if (transcript) onInterim?.(transcript);

      if (canCompleteEarly(transcript)) {
        clearFinalize();
        done(transcript);
        return;
      }

      const last = ev.results[ev.results.length - 1];
      if (last?.isFinal && transcript.length > 0 && mode !== "phone" && mode !== "email") {
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
      }, mode === "phone" || mode === "email" ? 400 : 200);
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
    mode === "phone" || mode === "email" ? LANGS_DIGITS : short ? LANGS_SHORT : LANGS_NORMAL;
  const perLangMs =
    mode === "phone" ? Math.max(maxMs, 38000) : mode === "email" ? Math.max(maxMs, 32000) : maxMs;

  let lastErr = "no-speech";
  let combined = "";

  for (const lang of langs) {
    try {
      const text = await listenWithLanguage(lang, perLangMs, mode, onInterim);
      combined = `${combined} ${text}`.trim();
      if (mode === "phone" && isCompletePhone(combined)) return combined;
      if (mode === "email" && isLikelyCompleteEmail(combined)) return combined;
      if (mode !== "phone" && mode !== "email" && text.trim()) return text.trim();
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
      const maxMs = options?.maxMs ?? (mode === "phone" ? 38000 : mode === "email" ? 32000 : 18000);
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
