import { CheckCircle2 } from "lucide-react";

type AboutProps = {
  aboutIntro?: string | null;
  mission?: string | null;
  vision?: string | null;
  whyChooseUs?: string | null;
};

const fallbackIntro =
  "Shiv Dental Clinic combines experienced specialists, modern technology, and a warm environment so every visit feels comfortable and clear.";

export function AboutSection({ aboutIntro, mission, vision, whyChooseUs }: AboutProps) {
  const bullets = (whyChooseUs ?? "")
    .split(/[.\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
    .slice(0, 4);

  const displayBullets =
    bullets.length > 0
      ? bullets
      : [
          "Experienced & certified dental specialists",
          "Advanced sterilization & digital diagnostics",
          "Transparent pricing & treatment plans",
          "Flexible appointments & emergency support",
        ];

  return (
    <section id="about" className="scroll-mt-24 bg-slate-50 py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-6 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <h2 className="section-title">About our clinic</h2>
          <p className="section-subtitle">{aboutIntro ?? fallbackIntro}</p>
          <div className="mt-8 space-y-4">
            {mission && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">Mission</p>
                <p className="mt-2 text-sm text-slate-600">{mission}</p>
              </div>
            )}
            {vision && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">Vision</p>
                <p className="mt-2 text-sm text-slate-600">{vision}</p>
              </div>
            )}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="rounded-3xl bg-gradient-to-br from-[var(--primary)] to-teal-500 p-1">
            <div className="rounded-[1.35rem] bg-white p-8">
              <h3 className="text-lg font-bold text-slate-900">Why patients choose us</h3>
              <ul className="mt-6 space-y-4">
                {displayBullets.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cta)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
