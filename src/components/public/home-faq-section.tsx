import { ChevronDown } from "lucide-react";

export type FaqItem = { question: string; answer: string };

export const DEFAULT_HOME_FAQS: FaqItem[] = [
  {
    question: "How do I book a dental appointment at Shiv Dental Clinic?",
    answer:
      "Use the Book Appointment form on our homepage or visit the Appointment page. Choose your service, preferred date and time, and we will confirm by phone or email shortly.",
  },
  {
    question: "Which dental treatments do you offer?",
    answer:
      "We provide general dentistry, teeth cleaning, fillings, root canal, crowns, dental implants, braces, teeth whitening, pediatric care, and cosmetic smile makeovers.",
  },
  {
    question: "Do you accept walk-in or emergency dental cases?",
    answer:
      "Yes — call our clinic number for urgent pain, swelling, or broken teeth. We prioritise emergency slots when possible during working hours.",
  },
  {
    question: "Are your instruments sterilised and is treatment painless?",
    answer:
      "We follow strict sterilisation protocols and use modern anaesthesia and gentle techniques so most procedures are comfortable and stress-free.",
  },
  {
    question: "Do you have multiple clinic branches?",
    answer:
      "Yes. Browse our Branches section to find locations, timings, and directions. You can book at the branch nearest to you.",
  },
];

type Props = {
  clinicName: string;
  faqs?: FaqItem[];
};

export function HomeFaqSection({ clinicName, faqs = DEFAULT_HOME_FAQS }: Props) {
  return (
    <section id="faq" className="scroll-mt-24 bg-gradient-to-b from-slate-50 to-white py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">FAQ</p>
          <h2 className="section-title mt-2">Common questions about {clinicName}</h2>
          <p className="section-subtitle mx-auto">
            Quick answers to help you plan your visit — great for patients and search engines alike.
          </p>
        </div>
        <div className="mt-10 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 open:ring-[var(--primary)]/30"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-slate-900 marker:content-none">
                {item.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function faqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}
