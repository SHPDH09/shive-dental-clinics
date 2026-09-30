"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognition;

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

/** Prompt for mic access while the user gesture is still active (before long TTS). */
export async function ensureMicrophoneAccess(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("mic-unavailable");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  for (const track of stream.getTracks()) track.stop();
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useSpeechRecognition(lang = "hi-IN") {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  const listenOnce = useCallback(
    (options?: { maxMs?: number }): Promise<string> => {
      const maxMs = options?.maxMs ?? 14000;

      return new Promise(async (resolve, reject) => {
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) {
          setSupported(false);
          reject(new Error("unsupported"));
          return;
        }
        setSupported(true);

        if (activeRef.current) {
          try {
            recRef.current?.abort();
          } catch {
            /* ignore */
          }
        }

        await delay(650);

        const rec = new Ctor();
        recRef.current = rec;
        activeRef.current = true;
        rec.lang = lang;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.continuous = true;

        let finalText = "";
        let settled = false;

        const finish = (text: string) => {
          if (settled) return;
          settled = true;
          activeRef.current = false;
          setListening(false);
          try {
            rec.stop();
          } catch {
            /* ignore */
          }
          resolve(text.trim());
        };

        const fail = (err: string) => {
          if (settled) return;
          settled = true;
          activeRef.current = false;
          setListening(false);
          try {
            rec.abort();
          } catch {
            /* ignore */
          }
          reject(new Error(err));
        };

        const timer = window.setTimeout(() => {
          if (finalText.trim()) finish(finalText);
          else fail("timeout");
        }, maxMs);

        rec.onresult = (ev: SpeechRecognitionEvent) => {
          let chunk = "";
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const part = ev.results[i]?.[0]?.transcript ?? "";
            if (ev.results[i]?.isFinal) chunk += part;
            else chunk += part;
          }
          if (chunk.trim()) finalText = `${finalText} ${chunk}`.trim();
          if (ev.results.length > 0 && ev.results[ev.results.length - 1]?.isFinal && finalText.length > 1) {
            window.clearTimeout(timer);
            finish(finalText);
          }
        };

        rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
          window.clearTimeout(timer);
          if (finalText.trim() && (ev.error === "no-speech" || ev.error === "aborted")) {
            finish(finalText);
            return;
          }
          if (ev.error === "not-allowed") fail("not-allowed");
          else if (ev.error === "no-speech") fail("no-speech");
          else fail(ev.error || "listen_failed");
        };

        rec.onend = () => {
          setListening(false);
          window.clearTimeout(timer);
          if (!settled) {
            if (finalText.trim()) finish(finalText);
            else fail("no-speech");
          }
        };

        setListening(true);
        try {
          rec.start();
        } catch (e) {
          window.clearTimeout(timer);
          activeRef.current = false;
          setListening(false);
          reject(e);
        }
      });
    },
    [lang],
  );

  const stop = useCallback(() => {
    activeRef.current = false;
    try {
      recRef.current?.abort();
    } catch {
      recRef.current?.stop();
    }
    setListening(false);
  }, []);

  return { listenOnce, listening, stop, supported };
}
