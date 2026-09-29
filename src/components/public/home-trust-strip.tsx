import { Award, Clock, HeartPulse, ShieldCheck, Sparkles, Users } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "Sterile & safe protocols" },
  { icon: HeartPulse, label: "Painless modern dentistry" },
  { icon: Users, label: "5,000+ happy patients" },
  { icon: Award, label: "Experienced specialists" },
  { icon: Clock, label: "Same-week appointments" },
  { icon: Sparkles, label: "Digital smile planning" },
];

export function HomeTrustStrip() {
  return (
    <section aria-label="Why trust Shiv Dental" className="border-y border-sky-100 bg-white/90 py-6 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-50/80 to-teal-50/50 px-4 py-3 ring-1 ring-sky-100/80"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
