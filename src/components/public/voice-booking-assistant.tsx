"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ensureMicrophoneAccess,
  isSpeechRecognitionSupported,
  useSpeechRecognition,
} from "@/hooks/use-speech-recognition";
import { HI, STEP_LABELS_HI } from "@/lib/voice-booking/prompts-hi";
import {
  isAffirmative,
  isNegative,
  isValidFutureDate,
  matchServiceName,
  normalizeTranscript,
  parseDateFromSpeech,
  parseEmailFromSpeech,
  parsePhoneFromSpeech,
  parseTimeFromSpeech,
  speakText,
} from "@/lib/voice-booking/speech-utils";
import { getOrCreateVisitorId, setStoredVisitorContact, syncVisitorLead } from "@/lib/visitor-contact";

type ServiceOption = { id: string; name: string };

type Draft = {
  patientName: string;
  phone: string;
  email: string;
  treatmentName: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
};

type StepId = keyof typeof STEP_LABELS_HI;

type Props = {
  open: boolean;
  onClose: () => void;
  services?: ServiceOption[];
};

export function VoiceBookingAssistant({ open, onClose, services: servicesProp }: Props) {
  const { listenOnce, listening, stop, supported } = useSpeechRecognition("hi-IN");
  const [services, setServices] = useState<ServiceOption[]>(servicesProp ?? []);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState<StepId>("intro");
  const [statusLine, setStatusLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [awaitingManualListen, setAwaitingManualListen] = useState(false);
  const manualRetryRef = useRef<(() => void) | null>(null);
  const draftRef = useRef<Draft>({
    patientName: "",
    phone: "",
    email: "",
    treatmentName: "",
    serviceId: "",
    appointmentDate: "",
    appointmentTime: "",
  });
  const runningRef = useRef(false);
  const openRef = useRef(open);

  openRef.current = open;

  useEffect(() => {
    if (servicesProp?.length) setServices(servicesProp);
  }, [servicesProp]);

  useEffect(() => {
    if (!open || servicesProp?.length) return;
    fetch("/api/public/services")
      .then((r) => r.json())
      .then((j: { items?: ServiceOption[] }) => setServices(j.items ?? []))
      .catch(() => setServices([]));
  }, [open, servicesProp]);

  useEffect(() => {
    if (!open) {
      stop();
      window.speechSynthesis?.cancel();
      runningRef.current = false;
      setStarted(false);
      setStep("intro");
      setError(null);
      setStatusLine("");
      setAwaitingManualListen(false);
      manualRetryRef.current = null;
    }
  }, [open, stop]);

  const listenForAnswer = useCallback(async (): Promise<string> => {
    for (let attempt = 0; attempt < 4; attempt++) {
      setAwaitingManualListen(false);
      setStatusLine(HI.listening);
      try {
        const raw = await listenOnce({ maxMs: 18000 });
        const t = normalizeTranscript(raw);
        if (t.length > 0) {
          setStatusLine(HI.youSaid(t));
          return t;
        }
      } catch (e) {
        const code = e instanceof Error ? e.message : "";
        if (code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture") {
          throw new Error(HI.micDenied);
        }
        if (code === "unsupported") throw new Error(HI.browserUnsupported);
      }
      setAwaitingManualListen(true);
      setStatusLine(HI.tapToSpeak);
      await new Promise<void>((resolve) => {
        manualRetryRef.current = resolve;
      });
    }
    return "";
  }, [listenOnce]);

  const askAndListen = useCallback(
    async (prompt: string): Promise<string> => {
      setStatusLine(prompt);
      await speakText(prompt, "hi-IN");
      return listenForAnswer();
    },
    [listenForAnswer],
  );

  const runFlow = useCallback(async () => {
    if (runningRef.current || !openRef.current) return;
    runningRef.current = true;
    setError(null);
    setReferenceId(null);

    try {
      if (!isSpeechRecognitionSupported()) {
        setError(HI.browserUnsupported);
        setStep("done");
        return;
      }

      setStep("intro");
      await speakText(HI.welcome, "hi-IN");

      setStep("name");
      let name = "";
      for (let i = 0; i < 3; i++) {
        const t = await askAndListen(i === 0 ? HI.askName : HI.retryName);
        if (t.length >= 2) {
          name = t;
          break;
        }
      }
      if (name.length < 2) throw new Error("नाम ज़रूरी है।");
      draftRef.current.patientName = name;

      setStep("phone");
      let phone = "";
      for (let i = 0; i < 3; i++) {
        const t = await askAndListen(i === 0 ? HI.askPhone : HI.retryPhone);
        phone = parsePhoneFromSpeech(t) ?? "";
        if (phone) break;
      }
      if (!phone) throw new Error("सही मोबाइल नंबर ज़रूरी है।");
      draftRef.current.phone = phone;

      setStep("email");
      let email = "";
      for (let i = 0; i < 3; i++) {
        const t = await askAndListen(i === 0 ? HI.askEmail : HI.retryEmail);
        email = parseEmailFromSpeech(t) ?? (t.includes("@") ? t.replace(/\s/g, "") : "");
        if (email.includes("@")) break;
      }
      if (!email.includes("@")) throw new Error("सही ईमेल ज़रूरी है।");
      draftRef.current.email = email;

      setStep("service");
      const svcList = services.length > 0 ? services : [{ id: "", name: "General consultation" }];
      const serviceHint = svcList
        .slice(0, 6)
        .map((s, i) => `${i + 1}: ${s.name}`)
        .join(", ");
      let matched = svcList[0];
      for (let i = 0; i < 3; i++) {
        const t = await askAndListen(i === 0 ? HI.askService(serviceHint) : HI.retryService);
        const m = matchServiceName(t, svcList);
        if (m) {
          matched = m;
          break;
        }
      }
      draftRef.current.treatmentName = matched.name;
      draftRef.current.serviceId = matched.id;

      setStep("date");
      let dateIso = "";
      for (let i = 0; i < 3; i++) {
        const t = await askAndListen(i === 0 ? HI.askDate : HI.retryDate);
        dateIso = parseDateFromSpeech(t) ?? "";
        if (dateIso && isValidFutureDate(dateIso)) break;
      }
      if (!dateIso) throw new Error("तारीख ज़रूरी है।");
      draftRef.current.appointmentDate = dateIso;

      setStep("time");
      let time = "";
      for (let i = 0; i < 3; i++) {
        const t = await askAndListen(i === 0 ? HI.askTime : HI.retryTime);
        time = parseTimeFromSpeech(t) ?? "";
        if (time) break;
      }
      if (!time) throw new Error("समय ज़रूरी है।");
      draftRef.current.appointmentTime = time;

      setStep("confirm");
      const summary = `${name}, ${matched.name}, तारीख ${dateIso}, समय ${time}`;
      let confirmed = false;
      for (let i = 0; i < 3; i++) {
        const t = await askAndListen(HI.confirm(summary));
        if (isAffirmative(t)) {
          confirmed = true;
          break;
        }
        if (isNegative(t)) {
          await speakText(HI.cancelled, "hi-IN");
          onClose();
          return;
        }
      }
      if (!confirmed) throw new Error("कन्फ़र्म नहीं हुआ।");

      setStep("submitting");
      const visitorId = getOrCreateVisitorId();
      const payload = { ...draftRef.current, visitorId };
      setStoredVisitorContact({
        name: payload.patientName,
        email: payload.email,
        phone: payload.phone,
      });

      const res = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { appointmentId?: string };
      if (!res.ok) throw new Error("बुकिंग नहीं हो सकी।");

      void syncVisitorLead("/", {
        name: payload.patientName,
        email: payload.email,
        phone: payload.phone,
      });

      const ref = json.appointmentId ?? "OK";
      setReferenceId(String(ref));
      setStep("done");
      await speakText(HI.success(name, String(ref)), "hi-IN");
    } catch (e) {
      const msg = e instanceof Error ? e.message : HI.failed;
      setError(msg);
      setStep("done");
      await speakText(HI.failed, "hi-IN");
    } finally {
      runningRef.current = false;
    }
  }, [askAndListen, onClose, services, supported]);

  const handleManualMic = () => {
    setAwaitingManualListen(false);
    manualRetryRef.current?.();
    manualRetryRef.current = null;
  };

  const handleStart = async () => {
    setStarted(true);
    setError(null);

    if (!isSpeechRecognitionSupported()) {
      setError(HI.browserUnsupported);
      setStep("done");
      return;
    }

    try {
      await ensureMicrophoneAccess();
    } catch {
      setError(HI.micDenied);
      setStep("done");
      return;
    }

    void runFlow();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-labelledby="voice-booking-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="voice-booking-title" className="text-lg font-bold text-slate-900">
              वॉइस बुकिंग असिस्टेंट
            </h2>
            <p className="mt-1 text-xs text-slate-500">शिव डेंटल क्लिनिक · हिंदी में बोलिए</p>
          </div>
          <button
            type="button"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
            onClick={() => {
              stop();
              window.speechSynthesis?.cancel();
              onClose();
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!started ? (
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              माइक्रोफ़ोन की अनुमति दें, फिर &quot;शुरू करें&quot; दबाएँ। हर सवाल हिंदी में सुनाई देगा।
            </p>
            <Button type="button" className="mt-6 w-full rounded-full" onClick={handleStart}>
              <Mic className="mr-2 h-4 w-4" />
              शुरू करें
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full ${
                listening ? "animate-pulse bg-red-100 text-red-600 ring-4 ring-red-200" : "bg-violet-100 text-violet-700"
              }`}
            >
              {step === "submitting" ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : (
                <Mic className="h-10 w-10" />
              )}
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-800">{STEP_LABELS_HI[step]}</p>
            {listening && <p className="mt-2 text-sm font-medium text-red-600">{HI.listening}</p>}
            {statusLine && !listening && (
              <p className="mt-2 text-center text-sm text-slate-600">{statusLine}</p>
            )}
            {awaitingManualListen && (
              <Button type="button" className="mt-4 rounded-full" onClick={handleManualMic}>
                <Mic className="mr-2 h-4 w-4" />
                {HI.tapToSpeak}
              </Button>
            )}
            {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
            {referenceId && (
              <p className="mt-3 rounded-xl bg-teal-50 px-4 py-2 text-sm font-medium text-teal-900">
                रेफरेंस: {referenceId}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            बंद करें
          </Button>
        </div>
      </div>
    </div>
  );
}
