export const dynamic = "force-dynamic";

import Link from "next/link";
import { brand } from "@/config/brand";
import { HomeNotesSection } from "@/components/home/home-notes-section";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { serializeNote } from "@/lib/serializers";
import { GraduationCap, ShieldCheck, Sparkles, Wallet } from "lucide-react";

export default async function HomePage() {
  let serialized: ReturnType<typeof serializeNote>[] = [];
  try {
    const notes = await prisma.note.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    serialized = notes.map((n) => serializeNote(n));
  } catch {
    serialized = [];
  }
  const featured = serialized.slice(0, 3);
  const popular = [...serialized].sort((a, b) => b.purchaseCount - a.purchaseCount).slice(0, 3);

  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:px-6">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Premium EdTech Marketplace
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            {brand.tagline}
          </h1>
          <p className="text-lg text-slate-600">{brand.shortDescription}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/notes">
              <Button size="lg">Browse Notes</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Create Student Account
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-8 text-white shadow-2xl">
          <Sparkles className="absolute right-6 top-6 h-8 w-8 opacity-70" />
          <p className="text-sm uppercase tracking-widest text-indigo-100">Smart learning</p>
          <p className="mt-4 text-3xl font-bold">Exam-ready notes. Instant access.</p>
          <p className="mt-3 max-w-md text-indigo-100">
            Secure checkout, verified purchases, and protected PDF delivery built for modern learners.
          </p>
        </div>
      </section>

      <HomeNotesSection notes={featured} title="Featured Notes" />
      <HomeNotesSection notes={popular} title="Popular Notes" />

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Why Choose {brand.name}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: GraduationCap, title: "Curated quality", text: "Every note is structured for clarity and exam success." },
            { icon: ShieldCheck, title: "Secure delivery", text: "Purchased PDFs stay private with signed access links." },
            { icon: Wallet, title: "Fair pricing", text: "Transparent discounts, coupons, and checkout totals." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <item.icon className="h-8 w-8 text-indigo-600" />
              <h3 className="mt-3 font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Purchase in 3 simple steps</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {["Browse notes", "Add to cart & apply coupon", "Checkout & access instantly"].map((step, i) => (
            <li key={step} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <span className="text-sm font-bold text-indigo-600">Step {i + 1}</span>
              <p className="mt-2 font-medium text-slate-900">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
