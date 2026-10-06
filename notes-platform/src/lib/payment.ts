import crypto from "crypto";
import { randomUUID } from "crypto";

export type PaymentInitResult = {
  provider: "cashfree" | "mock";
  orderId: string;
  paymentSessionId?: string;
  mockConfirmToken?: string;
};

function isMockMode() {
  return process.env.PAYMENT_PROVIDER === "mock" || !process.env.CASHFREE_APP_ID;
}

export async function createPaymentSession(params: {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
}): Promise<PaymentInitResult> {
  if (isMockMode()) {
    return {
      provider: "mock",
      orderId: params.orderId,
      mockConfirmToken: randomUUID(),
    };
  }

  const appId = process.env.CASHFREE_APP_ID!;
  const secret = process.env.CASHFREE_SECRET_KEY!;
  const env = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
  const base =
    env === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

  const orderPayload = {
    order_id: params.orderId,
    order_amount: params.amount,
    order_currency: "INR",
    customer_details: {
      customer_id: params.customerEmail.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50),
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone?.replace(/\D/g, "").slice(-10) || "9999999999",
      customer_name: params.customerName,
    },
    order_meta: {
      return_url: `${process.env.NEXTAUTH_URL}/checkout/complete?order_id=${params.orderId}`,
    },
  };

  const res = await fetch(`${base}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": appId,
      "x-client-secret": secret,
      "x-api-version": "2023-08-01",
    },
    body: JSON.stringify(orderPayload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payment provider error: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { payment_session_id?: string };
  if (!data.payment_session_id) throw new Error("Missing payment session from provider.");

  return {
    provider: "cashfree",
    orderId: params.orderId,
    paymentSessionId: data.payment_session_id,
  };
}

export function verifyCashfreeWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function fetchCashfreeOrderStatus(orderId: string): Promise<string | null> {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secret) return null;
  const env = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
  const base =
    env === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
  const res = await fetch(`${base}/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      "x-client-id": appId,
      "x-client-secret": secret,
      "x-api-version": "2023-08-01",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { order_status?: string };
  return data.order_status ?? null;
}
