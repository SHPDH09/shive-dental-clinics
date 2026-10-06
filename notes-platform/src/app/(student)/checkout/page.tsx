import { Suspense } from "react";
import CheckoutClient from "./checkout-client";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading checkout...</p>}>
      <CheckoutClient />
    </Suspense>
  );
}
