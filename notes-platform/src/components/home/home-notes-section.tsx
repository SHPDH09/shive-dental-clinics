"use client";

import { NoteCard, type PublicNote } from "@/components/notes/note-card";
import { addToCart, buyNowFlow } from "@/lib/client-api";

export function HomeNotesSection({ notes, title }: { notes: PublicNote[]; title: string }) {
  if (!notes.length) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-slate-600">
          No notes published yet. Admin can add notes from the dashboard.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onAddToCart={async (id) => {
              await addToCart(id);
            }}
            onBuyNow={buyNowFlow}
          />
        ))}
      </div>
    </section>
  );
}
