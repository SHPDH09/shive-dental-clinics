"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VoiceBookingTrigger } from "@/components/public/voice-booking-trigger";

type ServiceOption = { id: string; name: string };

export function HeroBookingActions({ services }: { services: ServiceOption[] }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href="/appointment" className="btn-primary gap-2">
        Book appointment
        <ArrowRight className="h-4 w-4" />
      </Link>
      <VoiceBookingTrigger
        services={services}
        variant="primary"
        label="Voice assistant"
        className="shadow-md"
      />
      <Link href="/#book" className="btn-secondary">
        Quick form
      </Link>
      <Link href="/#services" className="btn-secondary hidden sm:inline-flex">
        Explore services
      </Link>
    </div>
  );
}
