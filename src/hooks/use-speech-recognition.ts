"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestMicrophoneStream } from "@/lib/voice-booking/mic-permission";

type SpeechRecognitionCtor = new () => SpeechRecognition;

const LANGS_NORMAL = ["hi-IN", "en-IN", "en-US"] as const;
const LANGS_SHORT = ["en-IN", "hi-IN", "en-US"] as const;

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

function bestTranscriptFromEvent(ev: SpeechRecognitionEvent): string {
  let best = "";
  for (let i = ev.resultIndex; i < ev.results.length; i++) {
    const result = ev.results[i];
    if (!result) continue;
    for (let j = 0; j < result.length; j++) {
      const piece = result[j]?.transcript?.trim() ?? "";
      if (piece.length > best.length) best = piece;
    }
  }
  return best;
}

function listenWithLanguage(
  lang: string,
  maxMs: number,
  short: boolean,
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
    rec.continuous = !short;
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

    const scheduleFinalize = () => {
      clearFinalize();
      if (!transcript.trim()) return;
      finalizeTimer = setTimeout(() => {
        if (!settled && transcript.trim()) done(transcript);
      }, short ? 380 : 1200);
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
      const chunk = bestTranscriptFromEvent(ev);
      if (chunk) transcript = chunk;
      if (transcript) onInterim?.(transcript);

      const last = ev.results[ev.results.length - 1];
      if (last?.isFinal && transcript.length > 0) {
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
      }, short ? 280 : 150);
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
  options?: { short?: boolean },
): Promise<string> {
  const short = options?.short ?? false;
  const langs = short ? LANGS_SHORT : LANGS_NORMAL;
  const perLangMs = short ? Math.min(maxMs, 6500) : maxMs;

  let lastErr = "no-speech";
  for (const lang of langs) {
    try {
      const text = await listenWithLanguage(lang, perLangMs, short, onInterim);
      if (text.trim()) return text;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "listen_failed";
      if (lastErr === "not-allowed" || lastErr === "unsupported") throw e;
      await delay(150);
    }
  }
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
    (options?: { maxMs?: number; short?: boolean }): Promise<string> => {
      const maxMs = options?.maxMs ?? 18000;
      const short = options?.short ?? false;
      cancelRef.current = false;
      setInterimText("");
      setListening(true);

      const task = listenForSpeech(
        maxMs,
        (t) => {
          if (!cancelRef.current) setInterimText(t);
        },
        { short },
      );

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
