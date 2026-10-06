"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { BookOpen, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export type PublicNote = {
  id: string;
  title: string;
  description: string;
  coverImage?: string | null;
  price: number;
  finalPrice: number;
  discountPercent: number;
  owned?: boolean;
};

export function NoteCard({
  note,
  onAddToCart,
  onBuyNow,
}: {
  note: PublicNote;
  onAddToCart?: (id: string) => Promise<void>;
  onBuyNow?: (id: string) => Promise<void>;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_25px_60px_-35px_rgba(79,70,229,0.45)] transition hover:-translate-y-1 hover:shadow-[0_30px_70px_-35px_rgba(79,70,229,0.55)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-50">
        {note.coverImage ? (
          <Image src={note.coverImage} alt={note.title} fill className="object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-indigo-400">
            <BookOpen className="h-12 w-12" />
          </div>
        )}
        {note.discountPercent > 0 && <Badge className="absolute left-4 top-4">{note.discountPercent}% OFF</Badge>}
        {note.owned && <Badge variant="success" className="absolute right-4 top-4">Purchased</Badge>}
      </div>
      <div className="space-y-3 p-5">
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{note.title}</h3>
        <p className="line-clamp-2 text-sm text-slate-600">{note.description}</p>
        <div className="flex items-end gap-2">
          {note.price > note.finalPrice && (
            <span className="text-sm text-slate-400 line-through">{formatCurrency(note.price)}</span>
          )}
          <span className="text-xl font-bold text-indigo-700">{formatCurrency(note.finalPrice)}</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/notes/${note.id}`} className="flex-1">
            <Button variant="secondary" className="w-full" size="sm">
              View Details
            </Button>
          </Link>
          {!note.owned && onAddToCart && (
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  await onAddToCart(note.id);
                  toast.success("Note added to cart.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not add to cart.");
                }
              }}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
          {!note.owned && onBuyNow && (
            <Button
              size="sm"
              className="flex-1"
              onClick={async () => {
                try {
                  await onBuyNow(note.id);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not proceed.");
                }
              }}
            >
              Buy Now
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
