"use client";

import { Mic } from "lucide-react";
import { useState } from "react";
import { VoiceBookingAssistant } from "@/components/public/voice-booking-assistant";

type ServiceOption = { id: string; name: string };

/** Floating voice book button — homepage only. */
export function HomeVoiceFab({ services }: { services: ServiceOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg ring-2 ring-white/80 transition hover:bg-violet-500 md:bottom-8 md:right-8"
        aria-label="Book with voice assistant"
      >
        <Mic className="h-5 w-5" aria-hidden />
        <span className="hidden sm:inline">Voice book</span>
      </button>
      <VoiceBookingAssistant open={open} onClose={() => setOpen(false)} services={services} />
    </>
  );
}
