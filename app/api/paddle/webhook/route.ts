import { NextResponse } from "next/server";

import { getProfileByPaddleCustomerId, upsertPaddleSubscription } from "@/lib/db";
import {
  getPaddleSubscriptionSnapshotFromWebhook,
  getPaddleUserIdFromPayload,
  isPaddleSubscriptionEvent,
  isPaddleTransactionEvent,
  type PaddleWebhookPayload,
  verifyPaddleSignature,
} from "@/lib/paddle/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        {
          received: false,
          configured: false,
          message: "Paddle webhook is not configured in this environment.",
        },
        { status: 503 },
      );
    }

    const rawBody = await request.text();
    const signatureHeader = request.headers.get("paddle-signature");

    if (!verifyPaddleSignature({ rawBody, signatureHeader, secret: webhookSecret })) {
      return NextResponse.json({ message: "Invalid Paddle signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as PaddleWebhookPayload;

    if (!isPaddleSubscriptionEvent(payload.event_type) && !isPaddleTransactionEvent(payload.event_type)) {
      return NextResponse.json({ received: true });
    }

    const snapshot = await getPaddleSubscriptionSnapshotFromWebhook(payload);

    if (!snapshot) {
      console.warn("Paddle webhook did not include a usable subscription payload.", payload.event_type);
      return NextResponse.json({ received: true });
    }

    let userId = getPaddleUserIdFromPayload(payload);

    if (!userId && snapshot.paddleCustomerId) {
      const profile = await getProfileByPaddleCustomerId(snapshot.paddleCustomerId);
      userId = profile?.id ?? null;
    }

    if (!userId) {
      console.warn("Paddle webhook could not be matched to a ScamGate user.", payload.event_type);
      return NextResponse.json({ received: true });
    }

    await upsertPaddleSubscription({
      ...snapshot,
      userId,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paddle webhook handling failed.", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "Webhook handling failed." }, { status: 400 });
  }
}
