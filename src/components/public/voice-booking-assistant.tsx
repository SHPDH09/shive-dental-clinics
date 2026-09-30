"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
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

type StepId =
  | "intro"
  | "name"
  | "phone"
  | "email"
  | "service"
  | "date"
  | "time"
  | "confirm"
  | "submitting"
  | "done";

const STEP_LABELS: Record<StepId, string> = {
  intro: "Starting…",
  name: "Your name",
  phone: "Phone number",
  email: "Email",
  service: "Treatment / service",
  date: "Preferred date",
  time: "Preferred time",
  confirm: "Confirm booking",
  submitting: "Booking…",
  done: "Done",
};

type Props = {
  open: boolean;
  onClose: () => void;
  services?: ServiceOption[];
};

export function VoiceBookingAssistant({ open, onClose, services: servicesProp }: Props) {
  const { listenOnce, listening, stop, supported } = useSpeechRecognition("en-IN");
  const [services, setServices] = useState<ServiceOption[]>(servicesProp ?? []);
  const [step, setStep] = useState<StepId>("intro");
  const [statusLine, setStatusLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
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

  const askAndListen = useCallback(
    async (prompt: string): Promise<string> => {
      setStatusLine(prompt);
      await speakText(prompt);
      const raw = await listenOnce();
      const t = normalizeTranscript(raw);
      setStatusLine(`You said: “${t}”`);
      return t;
    },
    [listenOnce],
  );

  const runFlow = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setError(null);
    setReferenceId(null);
    draftRef.current = {
      patientName: "",
      phone: "",
      email: "",
      treatmentName: "",
      serviceId: "",
      appointmentDate: "",
      appointmentTime: "",
    };

    try {
      if (supported === false) {
        setError("Voice booking needs Chrome or Edge on Android/desktop. Please use the form instead.");
        setStep("done");
        return;
      }

      setStep("intro");
      await speakText(
        "Welcome to Shiv Dental Clinic voice booking. I will ask a few questions. Please answer clearly after each beep.",
      );

      setStep("name");
      let name = "";
      for (let i = 0; i < 2; i++) {
        const t = await askAndListen("What is your full name?");
        if (t.length >= 2) {
          name = t;
          break;
        }
        await speakText("Sorry, I did not catch your name. Please say your full name again.");
      }
      if (name.length < 2) throw new Error("Name is required.");
      draftRef.current.patientName = name;

      setStep("phone");
      let phone = "";
      for (let i = 0; i < 2; i++) {
        const t = await askAndListen("Please say your ten digit mobile number.");
        phone = parsePhoneFromSpeech(t) ?? "";
        if (phone) break;
        await speakText("Please say only your mobile number, ten digits.");
      }
      if (!phone) throw new Error("Valid phone number is required.");
      draftRef.current.phone = phone;

      setStep("email");
      let email = "";
      for (let i = 0; i < 2; i++) {
        const t = await askAndListen("What is your email address for confirmation?");
        email = parseEmailFromSpeech(t) ?? (t.includes("@") ? t.replace(/\s/g, "") : "");
        if (email.includes("@")) break;
        await speakText("Please say your email again, for example name at gmail dot com.");
      }
      if (!email.includes("@")) throw new Error("Valid email is required.");
      draftRef.current.email = email;

      setStep("service");
      const svcList = services.length > 0 ? services : [{ id: "", name: "General consultation" }];
      const serviceHint = svcList
        .slice(0, 8)
        .map((s, i) => `${i + 1} ${s.name}`)
        .join(", ");
      let matched = svcList[0];
      for (let i = 0; i < 2; i++) {
        const t = await askAndListen(
          `Which treatment do you need? You can say the name or number. Options include: ${serviceHint}.`,
        );
        matched = matchServiceName(t, svcList) ?? matched;
        if (matchServiceName(t, svcList)) break;
      }
      draftRef.current.treatmentName = matched.name;
      draftRef.current.serviceId = matched.id;

      setStep("date");
      let dateIso = "";
      for (let i = 0; i < 2; i++) {
        const t = await askAndListen("Which date do you prefer? You can say today, tomorrow, or a date.");
        dateIso = parseDateFromSpeech(t) ?? "";
        if (dateIso && isValidFutureDate(dateIso)) break;
        await speakText("Please say a valid date from today onwards.");
      }
      if (!dateIso) throw new Error("Appointment date is required.");
      draftRef.current.appointmentDate = dateIso;

      setStep("time");
      let time = "";
      for (let i = 0; i < 2; i++) {
        const t = await askAndListen("What time suits you? For example ten thirty AM or three PM.");
        time = parseTimeFromSpeech(t) ?? "";
        if (time) break;
      }
      if (!time) throw new Error("Appointment time is required.");
      draftRef.current.appointmentTime = time;

      setStep("confirm");
      const summary = `${name}, ${matched.name}, on ${dateIso} at ${time}.`;
      let confirmed = false;
      for (let i = 0; i < 2; i++) {
        const t = await askAndListen(`Please confirm your booking. ${summary} Say yes to book or no to cancel.`);
        if (isAffirmative(t)) {
          confirmed = true;
          break;
        }
        if (isNegative(t)) {
          await speakText("Booking cancelled. You can try again anytime.");
          onClose();
          return;
        }
      }
      if (!confirmed) throw new Error("Booking was not confirmed.");

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
      const json = (await res.json()) as { appointmentId?: string; error?: unknown };
      if (!res.ok) throw new Error("Could not complete booking. Please use the form.");

      void syncVisitorLead("/appointment", {
        name: payload.patientName,
        email: payload.email,
        phone: payload.phone,
      });

      const ref = json.appointmentId ?? "submitted";
      setReferenceId(String(ref));
      setStep("done");
      await speakText(
        `Thank you ${name}. Your appointment request is submitted. Reference ${ref}. Our team will confirm shortly.`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Voice booking failed.";
      setError(msg);
      setStep("done");
      await speakText("Sorry, we could not complete voice booking. Please use the booking form on this page.");
    } finally {
      runningRef.current = false;
    }
  }, [askAndListen, onClose, services, supported]);

  useEffect(() => {
    if (open) {
      void runFlow();
    } else {
      stop();
      runningRef.current = false;
      setStep("intro");
      setError(null);
      setStatusLine("");
    }
    return () => {
      stop();
      window.speechSynthesis?.cancel();
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- run once per open

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
              Voice booking assistant
            </h2>
            <p className="mt-1 text-xs text-slate-500">Shiv Dental Clinic · speak after each prompt</p>
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

        <div className="mt-6 flex flex-col items-center">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full ${
              listening ? "animate-pulse bg-red-100 text-red-600" : "bg-sky-100 text-[var(--primary)]"
            }`}
          >
            {step === "submitting" ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : listening ? (
              <Mic className="h-10 w-10" />
            ) : (
              <MicOff className="h-10 w-10 opacity-40" />
            )}
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-800">{STEP_LABELS[step]}</p>
          {statusLine && <p className="mt-2 text-center text-sm text-slate-600">{statusLine}</p>}
          {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
          {referenceId && (
            <p className="mt-3 rounded-xl bg-teal-50 px-4 py-2 text-sm font-medium text-teal-900">
              Reference: {referenceId}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
