import { Suspense } from "react";
import CheckoutCompleteClient from "./complete-client";

export const dynamic = "force-dynamic";

export default function CheckoutCompletePage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Confirming purchase...</p>}>
      <CheckoutCompleteClient />
    </Suspense>
  );
}
