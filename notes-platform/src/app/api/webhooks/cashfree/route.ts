import { NextResponse } from "next/server";
import { finalizeSuccessfulOrder } from "@/lib/checkout";
import { verifyCashfreeWebhookSignature } from "@/lib/payment";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  if (!verifyCashfreeWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    data?: { order?: { order_id?: string; order_status?: string } };
  };
  const orderId = payload.data?.order?.order_id;
  const status = payload.data?.order?.order_status;
  if (!orderId || status !== "PAID") {
    return NextResponse.json({ ok: true });
  }

  await finalizeSuccessfulOrder(orderId);
  return NextResponse.json({ ok: true });
}
