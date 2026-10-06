"use client";

import { useEffect, useState } from "react";
import { NoteCard, type PublicNote } from "@/components/notes/note-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addToCart, api, buyNowFlow } from "@/lib/client-api";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotesPage() {
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, ...(q ? { q } : {}) });
      const data = await api<{ notes: PublicNote[] }>(`/api/notes?${params.toString()}`);
      setNotes(data.notes);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Browse Notes</h1>
      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <Input placeholder="Search notes..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
        <Button onClick={() => void load()}>Search</Button>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      )}
    </div>
  );
}
