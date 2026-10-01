"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSpeechRecognitionSupported, useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
  errorToMicCode,
  micErrorMessage,
  requestMicrophoneStream,
} from "@/lib/voice-booking/mic-permission";
import { parseNameFromSpeech } from "@/lib/voice-booking/bilingual-input";
import {
  hasEmailSpeechIntent,
  mergeSpokenEmailParts,
  pickBestEmailFromSpeech,
  previewEmailFromSpeech,
} from "@/lib/voice-booking/email-voice-parse";
import {
  hasEnoughPhoneDigitsInSpeech,
  mergeSpokenPhoneParts,
  parseIndianMobileFromSpeech,
  previewPhoneDigitsFromSpeech,
} from "@/lib/voice-booking/phone-email-parse";
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
    }
  }, [open, stop]);

  const listenForAnswer = useCallback(
    async (options?: { short?: boolean; mode?: "phone" | "email" | "normal" | "short" }): Promise<string> => {
      const mode = options?.mode ?? (options?.short ? "short" : "normal");

      for (let attempt = 0; attempt < 2; attempt++) {
        setStatusLine(HI.listening);

        try {
          const raw = await listenOnce({
            maxMs: mode === "phone" ? 48000 : mode === "email" ? 45000 : mode === "short" ? 8000 : 18000,
            mode,
          });
          const t = normalizeTranscript(raw);
          if (t.length > 0) {
            setStatusLine(HI.youSaid(t));
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

  const listenOnly = useCallback(
    async (short = false): Promise<string> => {
      await waitForMicHandoff();
      return listenForAnswer({ short });
    },
    [listenForAnswer],
  );

  const askAndListen = useCallback(
    async (
      prompt: string,
      options?: { short?: boolean; mode?: "phone" | "email" | "normal" | "short" },
    ): Promise<string> => {
      setStatusLine(prompt);
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

  const confirmContactValue = useCallback(
    async (
      voicePrompt: () => string,
      collectFresh: () => Promise<string>,
      normalize: (raw: string) => string | null,
      initial: string,
      setPreview: (v: string) => void,
      contactKind: "phone" | "email",
    ): Promise<string> => {
      let value = normalize(initial) ?? initial;
      setPreview(value);
      for (let round = 0; round < 5; round++) {
        for (let attempt = 0; attempt < 3; attempt++) {
          setStatusLine(voicePrompt());
          await speakText(voicePrompt(), "hi-IN");
          await waitForMicHandoff();
          const t = await listenForAnswer({ short: true });
          const intent = normalizeIntentSpeech(t);
          const userSpokeNewPhone = contactKind === "phone" && hasEnoughPhoneDigitsInSpeech(t, 8);
          const userSpokeNewEmail = contactKind === "email" && hasEmailSpeechIntent(t);
          if (isAffirmative(intent) && !userSpokeNewPhone && !userSpokeNewEmail) {
            const ok = normalize(value);
            if (ok) return ok;
          }
          const spokenAgain = normalize(t);
          if (spokenAgain && (userSpokeNewPhone || userSpokeNewEmail) && !isNegative(intent)) {
            value = spokenAgain;
            setPreview(value);
            await speakText(
              contactKind === "phone"
                ? "Ji, naya number note kar liya. Sahi hai to haan boliye."
                : "Ji, nayi email note kar li. Sahi hai to haan boliye.",
              "hi-IN",
            );
            await waitForMicHandoff();
            continue;
          }
          if (isAffirmative(intent)) {
            const ok = normalize(value);
            if (ok) return ok;
          }
          if (isNegative(intent)) {
            await speakText("Theek hai ji, dubara boliye.", "hi-IN");
            await waitForMicHandoff();
            const fresh = normalize(await collectFresh());
            if (fresh) {
              value = fresh;
              setPreview(value);
              break;
            }
          } else if (t.trim()) {
            await speakText(
              contactKind === "phone"
                ? "Haan ya nahi boliye — ya sahi number dubara bol dijiye."
                : "Haan ya nahi boliye — ya poori email dubara bol dijiye.",
              "hi-IN",
            );
            await waitForMicHandoff();
          }
        }
      }
      throw new Error("Contact confirm nahi hua.");
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

      setStep("intent");
      let wantsBooking = false;
      for (let i = 0; i < 3; i++) {
        const t =
          i === 0 ? await listenOnly(true) : await askAndListen(HI.askIntentRetry, { short: true });
        const intent = normalizeIntentSpeech(t);
        const aiIntent = await resolveVoiceField(
          "intent",
          t,
          isAffirmative(intent) ? "yes" : isNegative(intent) ? "no" : null,
          aiEnabledRef.current,
        );
        await speakAiLine(aiIntent.say);
        const finalIntent =
          aiIntent.intent === "yes" || aiIntent.value === "yes"
            ? "haan"
            : aiIntent.intent === "no" || aiIntent.value === "no"
              ? "nahi"
              : intent;
        if (isAffirmative(finalIntent)) {
          wantsBooking = true;
          break;
        }
        if (isNegative(finalIntent)) {
          await speakConversation([HI.declinedBooking, "Have a good day!"]);
          onClose();
          return;
        }
      }
      if (!wantsBooking) throw new Error("Appointment confirm nahi hui. Dubara try karein.");

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
      phone = await confirmContactValue(
        HI.confirmPhone,
        () => listenForFullPhone((p) => setCapturedPhone(formatIndianMobileForDisplay(p))),
        normalizeIndianMobile,
        phone,
        (v) => setCapturedPhone(formatIndianMobileForDisplay(v)),
        "phone",
      );
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
      email = await confirmContactValue(
        HI.confirmEmail,
        () => listenForFullEmail(setCapturedEmail),
        normalizeVoiceEmail,
        email,
        setCapturedEmail,
        "email",
      );
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
      const summary = `${name} ji, mobile ${formatIndianMobileForReadback(phone)}, email ${formatEmailForReadback(email)}, treatment ${matched.name}, date ${dateIso}, time ${time}`;
      let confirmed = false;
      for (let i = 0; i < 3; i++) {
        const t = await askAndListen(HI.confirm(summary), { short: true });
        if (isAffirmative(normalizeIntentSpeech(t))) {
          confirmed = true;
          break;
        }
        if (isNegative(normalizeIntentSpeech(t))) {
          await speakText(HI.cancelled, "hi-IN");
          onClose();
          return;
        }
      }
      if (!confirmed) throw new Error("कन्फ़र्म नहीं हुआ।");

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
    confirmContactValue,
    listenForFullEmail,
    listenForFullPhone,
    listenOnly,
    onClose,
    services,
    supported,
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
            <p className="mt-1 text-xs text-slate-500">
              Shiv Dental Clinic · {aiAssistant ? "AI voice assistant" : "voice assistant"}
            </p>
            {aiAssistant && started && (
              <p className="mt-1 text-xs font-medium text-violet-600">AI cleanup ON — fast &amp; accurate input</p>
            )}
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
              Ek baar Mic Allow karein. Uske baad har jawab par mic apne aap on hoga, bolne ke baad band ho jayega — dubara mic button nahi dabana.
            </p>
            {micGranted && (
              <p className="mt-2 text-sm font-medium text-teal-700">Mic allowed — booking shuru ho rahi hai…</p>
            )}
            <Button
              type="button"
              className="mt-6 w-full rounded-full"
              disabled={requestingMic}
              onClick={handleAllowMicAndStart}
            >
              {requestingMic ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mic className="mr-2 h-4 w-4" />
              )}
              Mic Allow karein &amp; Shuru karein
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
            {listening && interimText && (
              <p className="mt-2 text-center text-sm font-medium text-teal-700">{HI.hearing(interimText)}</p>
            )}
            {listening && step === "phone" && interimText && (
              <p className="mt-2 text-center text-lg font-bold tracking-widest text-slate-800">
                {formatIndianMobileForDisplay(previewPhoneDigitsFromSpeech(interimText)) || "…"}
              </p>
            )}
            {listening && step === "email" && interimText && (
              <p className="mt-2 max-w-full px-2 text-center text-sm font-medium text-violet-900 break-all">
                {previewEmailFromSpeech(interimText) || "…"}
              </p>
            )}
            {statusLine && !listening && (
              <p className="mt-2 text-center text-sm text-slate-600">{statusLine}</p>
            )}
            {(step === "phone" || step === "confirm") && capturedPhone && (
              <p className="mt-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-center text-base font-semibold tracking-wide text-teal-900">
                Mobile: {capturedPhone}
              </p>
            )}
            {(step === "email" || step === "confirm") && capturedEmail && (
              <p className="mt-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-center text-sm font-medium text-violet-900 break-all">
                Email: {capturedEmail}
              </p>
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
