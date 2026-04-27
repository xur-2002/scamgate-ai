import { createHmac, timingSafeEqual } from "crypto";

import {
  paddleSubscriptionDataToSnapshot,
  retrievePaddleSubscription,
  type PaddleSubscriptionData,
  type PaddleSubscriptionSnapshot,
} from "@/lib/paddle/server";

export type PaddleWebhookPayload = {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: PaddleWebhookData;
  notification_id?: string;
};

type PaddleWebhookData = PaddleSubscriptionData & {
  id: string;
  customer_id?: string | null;
  subscription_id?: string | null;
};

const subscriptionEvents = new Set([
  "subscription.created",
  "subscription.activated",
  "subscription.updated",
  "subscription.canceled",
  "subscription.paused",
  "subscription.resumed",
  "subscription.past_due",
  "subscription.trialing",
]);

const transactionEvents = new Set(["transaction.completed", "transaction.paid"]);

function parseSignatureHeader(header: string | null): { timestamp: string | null; signatures: string[] } {
  if (!header) {
    return { timestamp: null, signatures: [] };
  }

  const parts = header.split(";").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("ts="))?.slice(3) ?? null;
  const signatures = parts.filter((part) => part.startsWith("h1=")).map((part) => part.slice(3));

  return { timestamp, signatures };
}

export function verifyPaddleSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
}): boolean {
  const { timestamp, signatures } = parseSignatureHeader(input.signatureHeader);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}:${input.rawBody}`;
  const expected = Buffer.from(createHmac("sha256", input.secret).update(signedPayload).digest("hex"), "utf8");

  return signatures.some((signature) => {
    const received = Buffer.from(signature, "utf8");

    if (received.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(received, expected);
  });
}

function getSubscriptionId(payload: PaddleWebhookPayload): string | null {
  if (payload.event_type?.startsWith("subscription.") && payload.data?.id) {
    return payload.data.id;
  }

  return payload.data?.subscription_id ?? null;
}

export function isPaddleSubscriptionEvent(eventType: string | undefined): boolean {
  return eventType ? subscriptionEvents.has(eventType) : false;
}

export function isPaddleTransactionEvent(eventType: string | undefined): boolean {
  return eventType ? transactionEvents.has(eventType) : false;
}

export async function getPaddleSubscriptionSnapshotFromWebhook(
  payload: PaddleWebhookPayload,
): Promise<PaddleSubscriptionSnapshot | null> {
  const subscriptionId = getSubscriptionId(payload);

  if (!subscriptionId) {
    return null;
  }

  if (isPaddleSubscriptionEvent(payload.event_type) && payload.data) {
    return paddleSubscriptionDataToSnapshot({
      data: payload.data,
      eventId: payload.event_id ?? null,
      occurredAt: payload.occurred_at ?? null,
      testMode: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT !== "production",
    });
  }

  if (isPaddleTransactionEvent(payload.event_type)) {
    const subscription = await retrievePaddleSubscription(subscriptionId);
    return paddleSubscriptionDataToSnapshot({
      data: subscription,
      eventId: payload.event_id ?? null,
      occurredAt: payload.occurred_at ?? null,
      testMode: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT !== "production",
    });
  }

  return null;
}

export function getPaddleUserIdFromPayload(payload: PaddleWebhookPayload): string | null {
  const userId = payload.data?.custom_data?.user_id;
  return typeof userId === "string" && userId ? userId : null;
}
