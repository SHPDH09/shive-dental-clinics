"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, addToCart } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type NoteDetail = {
  id: string;
  title: string;
  description: string;
  coverImage?: string | null;
  price: number;
  finalPrice: number;
  discountPercent: number;
  owned?: boolean;
};

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await api<{ note: NoteDetail }>(`/api/notes/${id}`);
        setNote(data.note);
      } catch {
        toast.error("Note not found.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Skeleton className="mx-auto mt-10 h-96 max-w-5xl" />;
  if (!note) return <p className="p-10 text-center text-slate-600">Note not found.</p>;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2 lg:px-6">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-indigo-50">
        {note.coverImage ? (
          <Image src={note.coverImage} alt={note.title} fill className="object-cover" />
        ) : null}
      </div>
      <div className="space-y-4">
        {note.discountPercent > 0 && <Badge>{note.discountPercent}% OFF</Badge>}
        <h1 className="text-3xl font-bold text-slate-900">{note.title}</h1>
        <p className="text-slate-600">{note.description}</p>
        <div className="flex items-end gap-3">
          {note.price > note.finalPrice && (
            <span className="text-slate-400 line-through">{formatCurrency(note.price)}</span>
          )}
          <span className="text-3xl font-bold text-indigo-700">{formatCurrency(note.finalPrice)}</span>
        </div>
        {note.owned ? (
          <div className="space-y-2">
            <Badge variant="success">Already Purchased</Badge>
            <Button className="w-full" onClick={() => router.push("/purchases")}>
              Open Notes
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={async () => {
                await addToCart(note.id);
                toast.success("Added to cart.");
              }}
            >
              Add to Cart
            </Button>
            <Button
              className="flex-1"
              onClick={async () => {
                await addToCart(note.id);
                router.push("/cart");
              }}
            >
              Buy Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
