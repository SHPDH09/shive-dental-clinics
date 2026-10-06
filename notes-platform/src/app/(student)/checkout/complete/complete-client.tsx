"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { toast } from "sonner";

export default function CheckoutCompleteClient() {
  const params = useSearchParams();
  const orderId = params.get("order_id");
  const [status, setStatus] = useState<"pending" | "success">("pending");

  useEffect(() => {
    if (!orderId) return;
    void (async () => {
      try {
        await api("/api/checkout/confirm", { method: "POST", body: JSON.stringify({ orderId }) });
        setStatus("success");
        toast.success("Note purchased successfully.");
      } catch {
        setStatus("pending");
      }
    })();
  }, [orderId]);

  return (
    <div className="mx-auto max-w-lg rounded-3xl border bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold">{status === "success" ? "Purchase Confirmed" : "Payment Processing"}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {status === "success"
          ? "Your notes are now available in Purchased Notes."
          : "If you completed payment, refresh in a moment or contact support."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/purchases">
          <Button>View Purchased Notes</Button>
        </Link>
        <Link href="/transactions">
          <Button variant="secondary">Transactions</Button>
        </Link>
      </div>
    </div>
  );
}
