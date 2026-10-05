"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Mic, X } from "lucide-react";
import { DataLoadingSection } from "@/components/branding/data-loading-section";
import { SdcLogoLoader } from "@/components/branding/sdc-logo-loader";
import { Button } from "@/components/ui/button";
import { VoiceAssistantOrb } from "@/components/public/voice-assistant-orb";
import { isSpeechRecognitionSupported, useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
  errorToMicCode,
  micErrorMessage,
  requestMicrophoneStream,
} from "@/lib/voice-booking/mic-permission";
import { parseNameFromSpeech } from "@/lib/voice-booking/bilingual-input";
import {
  mergeSpokenEmailParts,
  pickBestEmailFromSpeech,
  previewEmailFromSpeech,
} from "@/lib/voice-booking/email-voice-parse";
import {
  mergeSpokenPhoneParts,
  parseIndianMobileFromSpeech,
  previewPhoneDigitsFromSpeech,
} from "@/lib/voice-booking/phone-email-parse";
import { formatDateForSpeech } from "@/lib/voice-booking/date-voice-parse";
import { formatTime12Hour } from "@/lib/voice-booking/time-voice-parse";
import {
  formatEmailForReadback,
  formatIndianMobileForDisplay,
  formatIndianMobileForReadback,
  normalizeIndianMobile,
  normalizeVoiceEmail,
} from "@/lib/voice-booking/validate-contact";
import { appointmentPublicSchema } from "@/lib/validations";
import { getOrCreateVisitorId, setStoredVisitorContact, syncVisitorLead } from "@/lib/visitor-contact";
import { successConversation, welcomeConversation } from "@/lib/voice-booking/conversation-script";
import { HI, STEP_LABELS_HI } from "@/lib/voice-booking/prompts-hi";
import {
  fetchVoiceAiConfig,
  resolveVoiceField,
} from "@/lib/voice-booking/ai-client";
import {
  isAffirmative,
  isNegative,
  isValidFutureDate,
  matchServiceName,
  normalizeIntentSpeech,
  normalizeTranscript,
  parseDateFromSpeech,
  parseTimeFromSpeech,
  speakConversation,
  speakText,
  waitForMicHandoff,
} from "@/lib/voice-booking/speech-utils";

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
  const { listenOnce, listening, stop, supported, interimText } = useSpeechRecognition("hi-IN");
  const [services, setServices] = useState<ServiceOption[]>(servicesProp ?? []);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState<StepId>("intro");
  const [statusLine, setStatusLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [micGranted, setMicGranted] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);
  const [capturedPhone, setCapturedPhone] = useState("");
  const [capturedEmail, setCapturedEmail] = useState("");
  const [capturedDate, setCapturedDate] = useState("");
  const [capturedTime, setCapturedTime] = useState("");
  const [aiAssistant, setAiAssistant] = useState(false);
  const aiEnabledRef = useRef(false);
  const lastPhoneTranscriptRef = useRef("");
  const lastEmailTranscriptRef = useRef("");
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
  const verifyResolveRef = useRef<((ok: boolean) => void) | null>(null);
  const [verifySnapshot, setVerifySnapshot] = useState<Draft | null>(null);
  const [liveCaption, setLiveCaption] = useState("");

  openRef.current = open;

  const resolveVerify = useCallback((ok: boolean) => {
    const fn = verifyResolveRef.current;
    verifyResolveRef.current = null;
    fn?.(ok);
  }, []);

  const waitForUserVerify = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      verifyResolveRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (servicesProp?.length) setServices(servicesProp);
  }, [servicesProp]);

  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    if (!open || servicesProp?.length) return;
    setServicesLoading(true);
    fetch("/api/public/services")
      .then((r) => r.json())
      .then((j: { items?: ServiceOption[] }) => setServices(j.items ?? []))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, [open, servicesProp]);

  useEffect(() => {
    if (!open) return;
    void fetchVoiceAiConfig().then((on) => {
      aiEnabledRef.current = on;
      setAiAssistant(on);
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      stop();
      window.speechSynthesis?.cancel();
      runningRef.current = false;
      setStarted(false);
      setStep("intro");
      setError(null);
      setStatusLine("");
      setMicGranted(false);
      setRequestingMic(false);
      setCapturedPhone("");
      setCapturedEmail("");
      setCapturedDate("");
      setCapturedTime("");
      setVerifySnapshot(null);
      setLiveCaption("");
      verifyResolveRef.current = null;
    }
  }, [open, stop]);

  useEffect(() => {
    if (step !== "verify" || !started) return;
    let cancelled = false;
    void (async () => {
      await waitForMicHandoff();
      try {
        const raw = await listenOnce({ short: true, maxMs: 14000, mode: "short" });
        if (cancelled || !verifyResolveRef.current) return;
        const intent = normalizeIntentSpeech(raw);
        if (isAffirmative(intent)) resolveVerify(true);
        else if (isNegative(intent)) resolveVerify(false);
      } catch {
        /* user can tap Confirm */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, started, listenOnce, resolveVerify]);

  const listenForAnswer = useCallback(
    async (options?: {
      short?: boolean;
      mode?: "phone" | "email" | "normal" | "short" | "date";
    }): Promise<string> => {
      const mode = options?.mode ?? (options?.short ? "short" : "normal");

      for (let attempt = 0; attempt < 2; attempt++) {
        setStatusLine(HI.listening);
        setLiveCaption(HI.listening);

        try {
          const raw = await listenOnce({
            maxMs:
              mode === "phone"
                ? 48000
                : mode === "email"
                  ? 45000
                  : mode === "date"
                    ? 42000
                    : mode === "short"
                      ? 8000
                      : 18000,
            mode,
          });
          const t = normalizeTranscript(raw);
          if (t.length > 0) {
            setStatusLine(HI.youSaid(t));
            setLiveCaption(HI.youSaid(t));
            if (mode === "normal") {
              await speakText(HI.gotIt, "hi-IN");
              await waitForMicHandoff();
            }
            return t;
          }
        } catch (e) {
          const code = e instanceof Error ? e.message : "";
          if (code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture") {
            throw new Error(HI.micDenied);
          }
          if (code === "unsupported") throw new Error(HI.browserUnsupported);
        }

        if (attempt === 0) {
          setStatusLine(HI.retryListen);
          const retryMsg =
            mode === "phone"
              ? HI.retryPhoneListen
              : mode === "email"
                ? HI.retryEmailListen
                : mode === "short"
                  ? HI.retryListenShort
                  : HI.retryListen;
          await speakText(retryMsg, "hi-IN");
          await waitForMicHandoff();
        }
      }
      return "";
    },
    [listenOnce],
  );

  const askAndListen = useCallback(
    async (
      prompt: string,
      options?: { short?: boolean; mode?: "phone" | "email" | "normal" | "short" | "date" },
    ): Promise<string> => {
      setStatusLine(prompt);
      setLiveCaption(prompt);
      await speakText(prompt, "hi-IN");
      await waitForMicHandoff();
      return listenForAnswer(options);
    },
    [listenForAnswer],
  );

  const speakAiLine = useCallback(async (say?: string) => {
    if (!say?.trim()) return;
    setStatusLine(say);
    await speakText(say, "hi-IN");
    await waitForMicHandoff();
  }, []);

  const listenForFullPhone = useCallback(
    async (onPartial?: (display: string) => void): Promise<string> => {
      const parts: string[] = [];
      for (let i = 0; i < 3; i++) {
        if (i > 0) {
          await speakText(
            parts.length
              ? HI.phoneNeedMore
              : HI.retryPhoneListen,
            "hi-IN",
          );
          await waitForMicHandoff();
        }
        const chunk = await listenForAnswer({ mode: "phone" });
        if (chunk) parts.push(chunk);

        const solo = parseIndianMobileFromSpeech(chunk);
        if (solo) {
          lastPhoneTranscriptRef.current = parts.join(" ").trim() || chunk;
          onPartial?.(solo);
          return solo;
        }

        const merged = mergeSpokenPhoneParts(...parts);
        lastPhoneTranscriptRef.current = parts.join(" ").trim();
        const phone = parseIndianMobileFromSpeech(merged) ?? normalizeIndianMobile(merged) ?? "";
        const digitLen = merged.replace(/\D/g, "").length;
        if (phone.length === 10 && digitLen <= 11) {
          onPartial?.(phone);
          return phone;
        }
        if (digitLen > 0 && digitLen < 10) {
          onPartial?.(merged.replace(/\D/g, "").slice(0, 10));
        }
      }
      const last = mergeSpokenPhoneParts(...parts);
      lastPhoneTranscriptRef.current = parts.join(" ").trim();
      return parseIndianMobileFromSpeech(last) ?? normalizeIndianMobile(last) ?? "";
    },
    [listenForAnswer],
  );

  const listenForFullEmail = useCallback(
    async (onPartial?: (display: string) => void): Promise<string> => {
      const parts: string[] = [];
      for (let i = 0; i < 3; i++) {
        if (i > 0) {
          await speakText(i === 1 ? HI.emailNeedMore : HI.retryEmailListen, "hi-IN");
          await waitForMicHandoff();
        }
        const chunk = await listenForAnswer({ mode: "email" });
        if (chunk) parts.push(chunk);

        const solo = pickBestEmailFromSpeech(chunk);
        if (solo) {
          lastEmailTranscriptRef.current = parts.join(" ").trim() || chunk;
          onPartial?.(solo);
          return solo;
        }

        const merged = mergeSpokenEmailParts(...parts);
        lastEmailTranscriptRef.current = parts.join(" ").trim();
        const email = normalizeVoiceEmail(merged) ?? pickBestEmailFromSpeech(merged) ?? "";
        if (email && normalizeVoiceEmail(email)) {
          onPartial?.(email);
          return normalizeVoiceEmail(email)!;
        }
        if (merged.trim()) onPartial?.(previewEmailFromSpeech(merged));
      }
      const last = mergeSpokenEmailParts(...parts);
      lastEmailTranscriptRef.current = parts.join(" ").trim();
      return normalizeVoiceEmail(last) ?? pickBestEmailFromSpeech(last) ?? "";
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
      await speakConversation(welcomeConversation());

      setStep("name");
      let name = "";
      for (let i = 0; i < 3; i++) {
        const t = await askAndListen(i === 0 ? HI.askName : HI.retryName);
        const parsed = parseNameFromSpeech(t);
        const aiName = await resolveVoiceField(
          "name",
          t,
          parsed.length >= 2 ? parsed : t.trim().length >= 2 ? t.trim() : null,
          aiEnabledRef.current,
        );
        await speakAiLine(aiName.say);
        const candidate = aiName.value ?? (parsed.length >= 2 ? parsed : t.trim());
        if (candidate.length >= 2) {
          name = candidate;
          break;
        }
      }
      if (name.length < 2) throw new Error("नाम ज़रूरी है।");
      draftRef.current.patientName = name;
      const firstName = name.trim().split(/\s+/)[0] ?? name;

      setStep("phone");
      setCapturedPhone("");
      await speakText(HI.askPhone(firstName), "hi-IN");
      await waitForMicHandoff();
      let phone = await listenForFullPhone((p) => setCapturedPhone(formatIndianMobileForDisplay(p)));
      if (!phone) {
        await speakText(HI.retryPhone, "hi-IN");
        await waitForMicHandoff();
        phone = await listenForFullPhone((p) => setCapturedPhone(formatIndianMobileForDisplay(p)));
      }
      const aiPhone = await resolveVoiceField(
        "phone",
        lastPhoneTranscriptRef.current || phone,
        normalizeIndianMobile(phone),
        aiEnabledRef.current,
        { firstName, draft: draftRef.current },
      );
      if (aiPhone.value) phone = aiPhone.value;
      await speakAiLine(aiPhone.say);
      if (!normalizeIndianMobile(phone)) throw new Error("Sahi 10 digit mobile zaroori hai — 6 se 9 se shuru.");
      setCapturedPhone(formatIndianMobileForDisplay(phone));
      draftRef.current.phone = phone;

      setStep("email");
      setCapturedEmail("");
      await speakText(HI.askEmail(firstName), "hi-IN");
      await waitForMicHandoff();
      let email = await listenForFullEmail(setCapturedEmail);
      if (!email) {
        await speakText(HI.retryEmail, "hi-IN");
        await waitForMicHandoff();
        email = await listenForFullEmail(setCapturedEmail);
      }
      const aiEmail = await resolveVoiceField(
        "email",
        lastEmailTranscriptRef.current || email,
        normalizeVoiceEmail(email),
        aiEnabledRef.current,
        { firstName, draft: draftRef.current },
      );
      if (aiEmail.value) email = aiEmail.value;
      await speakAiLine(aiEmail.say);
      if (!normalizeVoiceEmail(email)) throw new Error("Sahi email zaroori hai.");
      setCapturedEmail(email);
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
      setCapturedDate("");
      let dateIso = "";
      for (let i = 0; i < 3; i++) {
        const t = await askAndListen(i === 0 ? HI.askDate : HI.retryDate, { mode: "date" });
        const localDate = parseDateFromSpeech(t) ?? "";
        const aiDate = await resolveVoiceField(
          "date",
          t,
          localDate && isValidFutureDate(localDate) ? localDate : null,
          aiEnabledRef.current,
          { firstName, draft: draftRef.current },
        );
        await speakAiLine(aiDate.say);
        const aiIso =
          aiDate.value && /^\d{4}-\d{2}-\d{2}$/.test(aiDate.value) ? aiDate.value : null;
        dateIso = aiIso ?? (localDate && isValidFutureDate(localDate) ? localDate : "");
        if (dateIso && isValidFutureDate(dateIso)) {
          setCapturedDate(formatDateForSpeech(dateIso));
          break;
        }
      }
      if (!dateIso || !isValidFutureDate(dateIso)) throw new Error("तारीख ज़रूरी है — aaj, kal, ya 5 October boliye.");
      draftRef.current.appointmentDate = dateIso;

      setStep("time");
      setCapturedTime("");
      let time = "";
      for (let i = 0; i < 3; i++) {
        const t = await askAndListen(i === 0 ? HI.askTime : HI.retryTime);
        const localTime = parseTimeFromSpeech(t) ?? "";
        const aiTime = await resolveVoiceField(
          "time",
          t,
          localTime,
          aiEnabledRef.current,
          { firstName, draft: draftRef.current },
        );
        await speakAiLine(aiTime.say);
        time = aiTime.value ?? localTime;
        if (time) {
          setCapturedTime(formatTime12Hour(time));
          break;
        }
      }
      if (!time) throw new Error("समय ज़रूरी है — 10 AM ya 3 PM boliye.");
      draftRef.current.appointmentTime = time;

      const dateSay = formatDateForSpeech(dateIso);
      const timeSay = formatTime12Hour(time);
      const summary = `${name} ji, ${matched.name}, ${dateSay}, ${timeSay}. Mobile aur email screen par hain.`;
      setVerifySnapshot({ ...draftRef.current });
      setStep("verify");
      setLiveCaption(summary);
      await speakText(HI.confirm(summary), "hi-IN");
      await speakText(HI.verifyIntro, "hi-IN");
      await waitForMicHandoff();

      const verified = await waitForUserVerify();
      if (!verified) {
        await speakText(HI.cancelled, "hi-IN");
        onClose();
        return;
      }

      setStep("submitting");
      const visitorId = getOrCreateVisitorId();
      const payload = { ...draftRef.current, visitorId };
      const parsed = appointmentPublicSchema.safeParse(payload);
      if (!parsed.success) {
        const first = parsed.error.issues[0]?.message ?? "Invalid details";
        throw new Error(first);
      }
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
      await speakConversation(successConversation(name, String(ref)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : HI.failed;
      setError(msg);
      setStep("done");
      await speakText(HI.failed, "hi-IN");
    } finally {
      runningRef.current = false;
    }
  }, [
    askAndListen,
    listenForFullEmail,
    listenForFullPhone,
    onClose,
    services,
    waitForUserVerify,
  ]);

  /** getUserMedia must start in this click handler (browser permission popup). */
  const handleAllowMicAndStart = () => {
    setError(null);
    setRequestingMic(true);

    requestMicrophoneStream()
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        setMicGranted(true);
        setRequestingMic(false);

        if (!isSpeechRecognitionSupported()) {
          setStarted(true);
          setError(HI.browserUnsupported);
          setStep("done");
          return;
        }

        setStarted(true);
        void runFlow();
      })
      .catch((e: unknown) => {
        setError(micErrorMessage(errorToMicCode(e)));
        setRequestingMic(false);
      });
  };

  const caption =
    listening && interimText
      ? HI.hearing(interimText)
      : liveCaption || statusLine;

  if (!open) return null;

  const showVerifyForm = step === "verify" && verifySnapshot;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white"
      role="dialog"
      aria-labelledby="voice-booking-title"
    >
      <header className="flex shrink-0 items-start justify-between gap-3 px-5 pb-2 pt-5 sm:px-8">
        <div>
          <h2 id="voice-booking-title" className="text-xl font-bold tracking-tight">
            Virtual Assistant
          </h2>
          <p className="mt-1 text-xs text-white/60">Shiv Dental Clinic</p>
          {aiAssistant && started && (
            <p className="mt-1 text-xs font-medium text-violet-300">Smart voice booking</p>
          )}
        </div>
        <button
          type="button"
          className="rounded-xl p-2 text-white/70 hover:bg-white/10"
          aria-label="Close"
          onClick={() => {
            resolveVerify(false);
            stop();
            window.speechSynthesis?.cancel();
            onClose();
          }}
        >
          <X className="h-6 w-6" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pb-6 sm:px-8">
        <DataLoadingSection
          loading={servicesLoading}
          label="Loading services…"
          minHeight="min-h-[200px]"
          theme="dark"
          className="w-full flex-1"
        >
        {!started ? (
          <div className="flex w-full max-w-lg flex-1 flex-col items-center justify-center text-center">
            <VoiceAssistantOrb active={false} listening={false} className="mb-8" />
            <p className="text-sm leading-relaxed text-white/80">
              Ek baar Mic Allow karein. Uske baad har jawab par mic apne aap on hoga — poora sentence boliye,
              jaise &quot;10 October&quot; ya &quot;5 September&quot;.
            </p>
            {micGranted && (
              <p className="mt-3 text-sm font-medium text-teal-300">Mic allowed — booking shuru ho rahi hai…</p>
            )}
            <Button
              type="button"
              className="mt-8 w-full max-w-sm rounded-full bg-violet-500 hover:bg-violet-400"
              disabled={requestingMic}
              onClick={handleAllowMicAndStart}
            >
              {requestingMic ? (
                <SdcLogoLoader size="xs" label="Starting…" hideLabel inline className="mr-2 py-0" />
              ) : (
                <Mic className="mr-2 h-4 w-4" />
              )}
              Mic Allow karein &amp; Shuru karein
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-violet-200/90">
              {STEP_LABELS_HI[step]}
            </p>
            {step === "submitting" ? (
              <div className="flex flex-1 flex-col items-center justify-center">
                <SdcLogoLoader size="lg" theme="dark" label="Appointment confirm ho rahi hai…" />
              </div>
            ) : (
              <VoiceAssistantOrb active={started} listening={listening} className="my-2 shrink-0" />
            )}

            <div className="mt-4 w-full max-w-xl rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Live text</p>
              <p className="mt-2 min-h-[3rem] text-center text-sm leading-relaxed text-white/95">{caption || "…"}</p>
              {listening && step === "phone" && interimText && (
                <p className="mt-2 text-center text-lg font-bold tracking-widest text-teal-200">
                  {formatIndianMobileForDisplay(previewPhoneDigitsFromSpeech(interimText)) || "…"}
                </p>
              )}
              {listening && step === "email" && interimText && (
                <p className="mt-2 text-center text-sm font-medium text-violet-200 break-all">
                  {previewEmailFromSpeech(interimText) || "…"}
                </p>
              )}
              {listening && step === "date" && interimText && (
                <p className="mt-2 text-center text-sm font-medium text-amber-200">
                  {parseDateFromSpeech(interimText)
                    ? formatDateForSpeech(parseDateFromSpeech(interimText)!)
                    : interimText}
                </p>
              )}
            </div>

            {showVerifyForm ? (
              <div className="mt-5 w-full max-w-xl rounded-2xl border border-emerald-400/30 bg-white/95 p-5 text-slate-900 shadow-xl">
                <p className="text-center text-sm font-bold text-slate-800">Final verification</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Naam</dt>
                    <dd className="font-semibold text-right">{verifySnapshot.patientName}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Mobile</dt>
                    <dd className="font-semibold text-right">
                      {formatIndianMobileForDisplay(verifySnapshot.phone)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="max-w-[58%] text-right font-medium break-all">{verifySnapshot.email}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Treatment</dt>
                    <dd className="font-semibold text-right">{verifySnapshot.treatmentName}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Date</dt>
                    <dd className="font-semibold text-right">
                      {formatDateForSpeech(verifySnapshot.appointmentDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Time</dt>
                    <dd className="font-semibold text-right">
                      {formatTime12Hour(verifySnapshot.appointmentTime)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => resolveVerify(true)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm &amp; Book
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 rounded-full"
                    onClick={() => resolveVerify(false)}
                  >
                    Galat hai / Cancel
                  </Button>
                </div>
                <p className="mt-3 text-center text-xs text-slate-500">Ya &quot;haan&quot; bol kar confirm karein</p>
              </div>
            ) : (
              <div className="mt-4 flex w-full max-w-xl flex-wrap justify-center gap-2">
                {capturedPhone && (step === "phone" || step === "time" || step === "date") && (
                  <span className="rounded-full border border-teal-400/40 bg-teal-950/50 px-3 py-1 text-xs text-teal-100">
                    {capturedPhone}
                  </span>
                )}
                {capturedEmail && step !== "phone" && step !== "name" && (
                  <span className="rounded-full border border-violet-400/40 bg-violet-950/50 px-3 py-1 text-xs text-violet-100 break-all">
                    {capturedEmail}
                  </span>
                )}
                {capturedDate && (step === "date" || step === "time") && (
                  <span className="rounded-full border border-amber-400/40 bg-amber-950/50 px-3 py-1 text-xs text-amber-100">
                    {capturedDate}
                  </span>
                )}
                {capturedTime && step === "time" && (
                  <span className="rounded-full border border-sky-400/40 bg-sky-950/50 px-3 py-1 text-xs text-sky-100">
                    {capturedTime}
                  </span>
                )}
              </div>
            )}

            {error && (
              <p className="mt-4 max-w-xl text-center text-sm text-red-300">{error}</p>
            )}
            {referenceId && (
              <p className="mt-4 rounded-xl bg-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-100">
                रेफरेंस: {referenceId}
              </p>
            )}
          </>
        )}
        </DataLoadingSection>
      </div>

      <footer className="shrink-0 border-t border-white/10 px-5 py-4 text-center sm:px-8">
        <Button
          type="button"
          variant="secondary"
          className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
          onClick={() => {
            resolveVerify(false);
            onClose();
          }}
        >
          बंद करें
        </Button>
      </footer>
    </div>
  );
}
