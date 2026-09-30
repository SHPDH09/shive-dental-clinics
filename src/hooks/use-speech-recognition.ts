"use client";

import { useCallback, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(lang = "en-IN") {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  const listenOnce = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        setSupported(false);
        reject(new Error("Speech recognition is not supported in this browser."));
        return;
      }
      setSupported(true);

      const rec = new Ctor();
      recRef.current = rec;
      rec.lang = lang;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;

      rec.onresult = (ev: SpeechRecognitionEvent) => {
        const text = ev.results[0]?.[0]?.transcript ?? "";
        resolve(text);
      };
      rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
        reject(new Error(ev.error || "listen_failed"));
      };
      rec.onend = () => {
        setListening(false);
      };

      setListening(true);
      try {
        rec.start();
      } catch (e) {
        setListening(false);
        reject(e);
      }
    });
  }, [lang]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { listenOnce, listening, stop, supported };
}
