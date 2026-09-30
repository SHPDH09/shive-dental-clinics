"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { VoiceBookingAssistant } from "@/components/public/voice-booking-assistant";
import { cn } from "@/lib/utils";

type ServiceOption = { id: string; name: string };

type Props = {
  services?: ServiceOption[];
  className?: string;
  variant?: "primary" | "outline";
  label?: string;
};

export function VoiceBookingTrigger({
  services,
  className,
  variant = "outline",
  label = "Voice booking",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition",
          variant === "primary"
            ? "bg-violet-600 text-white hover:bg-violet-500"
            : "border-2 border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-300",
          className,
        )}
      >
        <Mic className="h-4 w-4" aria-hidden />
        {label}
      </button>
      <VoiceBookingAssistant open={open} onClose={() => setOpen(false)} services={services} />
    </>
  );
}
