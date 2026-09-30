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

/** Ask for mic permission; optionally keep the stream open for the booking session. */
export async function ensureMicrophoneAccess(keepStream?: {
  current: MediaStream | null;
}): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("mic-unavailable");
  }
  if (keepStream?.current) {
    for (const track of keepStream.current.getTracks()) track.stop();
    keepStream.current = null;
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });
  if (keepStream) {
    keepStream.current = stream;
  } else {
    for (const track of stream.getTracks()) track.stop();
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type ListenSession = {
  promise: Promise<string>;
  /** Call from a user click/tap when the browser requires a fresh gesture. */
  begin: () => void;
  cancel: () => void;
};

function createListenSession(
  lang: string,
  maxMs: number,
  onInterim?: (text: string) => void,
): ListenSession {
  let beginImpl: (() => void) | null = null;
  let cancelImpl: (() => void) | null = null;

  const promise = new Promise<string>((resolve, reject) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      reject(new Error("unsupported"));
      return;
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = true;

    let finalText = "";
    let settled = false;
    let started = false;
    let restartCount = 0;
    const deadline = Date.now() + maxMs;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    const clearSilenceTimer = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    };

    const scheduleSilenceFinish = () => {
      clearSilenceTimer();
      if (!finalText.trim()) return;
      silenceTimer = setTimeout(() => {
        if (!settled && finalText.trim()) finish(finalText);
      }, 1600);
    };

    const finish = (text: string) => {
      if (settled) return;
      settled = true;
      clearSilenceTimer();
      try {
        rec.onend = null;
        rec.onerror = null;
        rec.onresult = null;
        rec.stop();
      } catch {
        try {
          rec.abort();
        } catch {
          /* ignore */
        }
      }
      resolve(text.trim());
    };

    const fail = (err: string) => {
      if (settled) return;
      settled = true;
      clearSilenceTimer();
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

    const bumpTranscript = (ev: SpeechRecognitionEvent) => {
      let combined = "";
      for (let i = 0; i < ev.results.length; i++) {
        combined += ev.results[i]?.[0]?.transcript ?? "";
      }
      combined = combined.trim();
      if (combined) {
        finalText = combined;
        onInterim?.(finalText);
        scheduleSilenceFinish();
      }
      const last = ev.results[ev.results.length - 1];
      if (last?.isFinal && finalText.length >= 1) {
        window.clearTimeout(timer);
        clearSilenceTimer();
        finish(finalText);
      }
    };

    rec.onresult = (ev) => bumpTranscript(ev);

    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (settled) return;
      if (finalText.trim() && (ev.error === "no-speech" || ev.error === "aborted")) {
        finish(finalText);
        return;
      }
      if (ev.error === "network" && restartCount < 4 && Date.now() < deadline) {
        restartCount++;
        window.setTimeout(() => tryStart(), 280);
        return;
      }
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed" || ev.error === "audio-capture") {
        window.clearTimeout(timer);
        fail("not-allowed");
        return;
      }
      if (ev.error === "no-speech" && Date.now() < deadline && restartCount < 12) {
        restartCount++;
        window.setTimeout(() => tryStart(), 200);
        return;
      }
      if (ev.error === "aborted") return;
      window.clearTimeout(timer);
      fail(ev.error || "listen_failed");
    };

    rec.onend = () => {
      if (settled) return;
      if (finalText.trim()) {
        finish(finalText);
        return;
      }
      if (Date.now() < deadline && restartCount < 12) {
        restartCount++;
        window.setTimeout(() => tryStart(), 180);
        return;
      }
      window.clearTimeout(timer);
      fail("no-speech");
    };

    const tryStart = () => {
      if (settled) return;
      try {
        rec.start();
        started = true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (/already started|recognition/i.test(msg) && Date.now() < deadline) {
          restartCount++;
          window.setTimeout(() => tryStart(), 250);
          return;
        }
        if (finalText.trim()) finish(finalText);
        else fail("start_failed");
      }
    };

    beginImpl = () => {
      if (settled || started) return;
      tryStart();
    };

    cancelImpl = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      clearSilenceTimer();
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      reject(new Error("cancelled"));
    };
  });

  return {
    promise,
    begin: () => beginImpl?.(),
    cancel: () => cancelImpl?.(),
  };
}

export function useSpeechRecognition(lang = "hi-IN") {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [interimText, setInterimText] = useState("");
  const sessionRef = useRef<ListenSession | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  const cancelActive = useCallback(() => {
    sessionRef.current?.cancel();
    sessionRef.current = null;
    activeRef.current = false;
    setListening(false);
    setInterimText("");
  }, []);

  const listenOnce = useCallback(
    (options?: {
      maxMs?: number;
      /** When true, caller must invoke returned `begin` from a click/tap handler. */
      deferStart?: boolean;
    }): Promise<string> & { begin?: () => void } => {
      const maxMs = options?.maxMs ?? 20000;
      cancelActive();

      const session = createListenSession(lang, maxMs, (t) => setInterimText(t));
      sessionRef.current = session;
      activeRef.current = true;
      setInterimText("");

      const wrapped = session.promise.finally(() => {
        activeRef.current = false;
        setListening(false);
        sessionRef.current = null;
      }) as Promise<string> & { begin?: () => void };

      wrapped.begin = () => {
        setListening(true);
        session.begin();
      };

      if (!options?.deferStart) {
        window.setTimeout(() => {
          if (sessionRef.current === session) {
            setListening(true);
            session.begin();
          }
        }, 120);
      }

      return wrapped;
    },
    [cancelActive, lang],
  );

  const stop = useCallback(() => {
    cancelActive();
  }, [cancelActive]);

  return { listenOnce, listening, stop, supported, interimText };
}
