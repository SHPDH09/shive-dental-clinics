import Link from "next/link";
import { Calendar, MessageCircle, Phone } from "lucide-react";

type Props = {
  phone: string;
  whatsapp?: string | null;
};

export function HomeCtaBand({ phone, whatsapp }: Props) {
  const wa = (whatsapp ?? phone).replace(/\D/g, "");
  const tel = phone.replace(/\s/g, "");

  return (
    <section className="relative overflow-hidden py-16">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-sky-700 to-teal-600"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 0%, transparent 45%), radial-gradient(circle at 80% 20%, rgb(234 179 8 / 0.4) 0%, transparent 40%)`,
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 text-center md:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Ready for a healthier, brighter smile?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-sky-100">
          Book online in under a minute or talk to our team — we will guide you to the right treatment and branch.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/appointment"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[var(--primary)] shadow-lg transition hover:scale-[1.02]"
          >
            <Calendar className="h-4 w-4" aria-hidden />
            Book appointment
          </Link>
          <a
            href={`tel:${tel}`}
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/80 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Call {phone}
          </a>
          {wa.length >= 10 && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
