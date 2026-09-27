"use client";

import Link from "next/link";
import { Calendar, MessageCircle, Phone } from "lucide-react";
import { whatsappLink } from "@/lib/utils";

type Props = {
  phone: string;
  whatsapp: string;
};

export function MobileStickyActions({ phone, whatsapp }: Props) {
  const wa = whatsappLink(whatsapp, "Hi, I would like to book an appointment at Shiv Dental Clinic.");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-3 gap-2">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 rounded-xl bg-green-50 py-2 text-xs font-semibold text-green-700"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </a>
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className="flex flex-col items-center gap-1 rounded-xl bg-sky-50 py-2 text-xs font-semibold text-[var(--primary)]"
        >
          <Phone className="h-5 w-5" />
          Call
        </a>
        <Link
          href="/appointment"
          className="flex flex-col items-center gap-1 rounded-xl bg-[var(--cta)] py-2 text-xs font-semibold text-white"
        >
          <Calendar className="h-5 w-5" />
          Book
        </Link>
      </div>
    </div>
  );
}
