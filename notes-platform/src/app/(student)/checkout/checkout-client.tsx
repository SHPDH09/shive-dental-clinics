"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { toast } from "sonner";

export default function CheckoutClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const couponCode = params.get("coupon") || undefined;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-bold">Secure Checkout</h1>
      <p className="text-sm text-slate-600">
        Prices, discounts, and coupons are verified on the server before payment is confirmed.
      </p>
      <Button
        className="w-full"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try {
            const checkout = await api<{ orderId: string; payment: { provider: string } }>("/api/checkout", {
              method: "POST",
              body: JSON.stringify({ couponCode }),
            });

            if (checkout.payment.provider === "mock") {
              await api("/api/checkout/confirm", {
                method: "POST",
                body: JSON.stringify({ orderId: checkout.orderId }),
              });
              toast.success("Payment successful!");
              router.push(`/checkout/complete?order_id=${checkout.orderId}`);
              return;
            }

            toast.message("Complete payment in Cashfree checkout, then return to confirm.");
            router.push(`/checkout/complete?order_id=${checkout.orderId}`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Checkout failed.");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Processing..." : "Pay securely"}
      </Button>
    </div>
  );
}
