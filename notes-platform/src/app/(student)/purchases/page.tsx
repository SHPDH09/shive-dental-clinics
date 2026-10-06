"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type Purchase = {
  id: string;
  noteId: string;
  title?: string;
  coverImage?: string | null;
  purchasedPrice: number;
  purchasedAt: string;
  hasPdf?: boolean;
  hasExternalLink?: boolean;
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    void api<{ purchases: Purchase[] }>("/api/purchases")
      .then((d) => setPurchases(d.purchases))
      .catch((e) => toast.error(e.message));
  }, []);

  async function openNote(noteId: string) {
    const data = await api<{ externalLink?: string | null; pdfUrl?: string | null }>(
      `/api/purchases/${noteId}/access`,
    );
    if (data.externalLink) window.open(data.externalLink, "_blank", "noopener,noreferrer");
    else if (data.pdfUrl) window.open(data.pdfUrl, "_blank", "noopener,noreferrer");
    else toast.error("No content available for this note.");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Purchased Notes</h1>
      {purchases.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-slate-600">No purchases yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {purchases.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="relative h-40 bg-indigo-50">
                {p.coverImage ? <Image src={p.coverImage} alt={p.title ?? "Note"} fill className="object-cover" /> : null}
              </div>
              <div className="space-y-2 p-4">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-xs text-slate-500">{new Date(p.purchasedAt).toLocaleString()}</p>
                <p className="text-sm text-indigo-700">{formatCurrency(p.purchasedPrice)}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void openNote(p.noteId)}>
                    Open Notes
                  </Button>
                  {p.hasPdf && (
                    <Button size="sm" variant="secondary" onClick={() => void openNote(p.noteId)}>
                      Download PDF
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
