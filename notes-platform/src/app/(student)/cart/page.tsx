"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type CartItem = { cartItemId: string; note: { id: string; title: string; finalPrice: number; owned?: boolean } };

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);

  async function load() {
    const data = await api<{ items: CartItem[]; subtotal: number; discount: number; total: number }>("/api/cart");
    setItems(data.items);
    setSubtotal(data.subtotal);
    setDiscount(data.discount);
    setTotal(data.total);
    setCouponDiscount(0);
  }

  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, []);

  const payable = Math.max(0, total - couponDiscount);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Shopping Cart</h1>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-slate-600">Your cart is empty.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.cartItemId} className="flex items-center justify-between rounded-2xl border bg-white p-4">
                <div>
                  <p className="font-semibold">{item.note.title}</p>
                  <p className="text-sm text-indigo-700">{formatCurrency(item.note.finalPrice)}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await api(`/api/cart/${item.note.id}`, { method: "DELETE" });
                    toast.success("Removed from cart.");
                    await load();
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></p>
            <p className="mt-2 flex justify-between text-sm"><span>Note discounts</span><span>-{formatCurrency(discount)}</span></p>
            <p className="mt-2 flex justify-between text-sm"><span>Merchandise total</span><span>{formatCurrency(total)}</span></p>
            <div className="mt-4 flex gap-2">
              <Input placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    const data = await api<{ couponDiscount: number }>("/api/cart/coupon", {
                      method: "POST",
                      body: JSON.stringify({ code: coupon }),
                    });
                    setCouponDiscount(data.couponDiscount);
                    toast.success("Coupon applied.");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Invalid coupon.");
                  }
                }}
              >
                Apply
              </Button>
            </div>
            {couponDiscount > 0 && (
              <p className="mt-2 flex justify-between text-sm text-emerald-700">
                <span>Coupon</span><span>-{formatCurrency(couponDiscount)}</span>
              </p>
            )}
            <p className="mt-4 flex justify-between text-lg font-bold">
              <span>Total</span><span>{formatCurrency(payable)}</span>
            </p>
            <Link href={`/checkout?coupon=${encodeURIComponent(coupon)}`} className="mt-4 block">
              <Button className="w-full">Proceed to Checkout</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
