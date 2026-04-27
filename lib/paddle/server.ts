export class PaddleConfigError extends Error {
  constructor(message = "Paddle is not configured in this environment.") {
    super(message);
    this.name = "PaddleConfigError";
  }
}

type PaddlePortalResponse = {
  data?: {
    urls?: {
      general?: {
        overview?: string;
      };
      subscriptions?: Array<{
        id?: string;
        links?: {
          overview?: string;
          cancel?: string;
          update_payment_method?: string;
        };
      }>;
    };
  };
  error?: {
    detail?: string;
    message?: string;
  };
};

type PaddleApiSubscriptionResponse = {
  data?: PaddleSubscriptionData;
  error?: {
    detail?: string;
    message?: string;
  };
};

export type PaddleSubscriptionData = {
  id: string;
  customer_id?: string | null;
  status?: string | null;
  items?: Array<{
    price?: {
      id?: string | null;
      product_id?: string | null;
    } | null;
    product?: {
      id?: string | null;
    } | null;
  }>;
  current_billing_period?: {
    starts_at?: string | null;
    ends_at?: string | null;
  } | null;
  scheduled_change?: unknown;
  collection_mode?: string | null;
  currency_code?: string | null;
  custom_data?: {
    user_id?: string;
    plan?: string;
  } | null;
};

export type PaddleSubscriptionSnapshot = {
  paddleSubscriptionId: string;
  paddleCustomerId: string | null;
  paddlePriceId: string | null;
  paddleProductId: string | null;
  status: string;
  currentBillingPeriodStartsAt: string | null;
  currentBillingPeriodEndsAt: string | null;
  scheduledChange: unknown;
  cancelAtPeriodEnd: boolean;
  collectionMode: string | null;
  currencyCode: string | null;
  testMode: boolean;
  lastEventId: string | null;
  lastEventOccurredAt: string | null;
};

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getPaddleEnvironment() {
  return process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";
}

export function getPaddleApiBaseUrl() {
  return getPaddleEnvironment() === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
}

function getPaddleApiKey() {
  const apiKey = process.env.PADDLE_API_KEY;

  if (!apiKey) {
    throw new PaddleConfigError();
  }

  return apiKey;
}

export async function createPaddleCustomerPortalSession(input: {
  customerId: string;
  subscriptionId?: string;
}): Promise<string> {
  const response = await fetch(`${getPaddleApiBaseUrl()}/customers/${input.customerId}/portal-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getPaddleApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      input.subscriptionId
        ? {
            subscription_ids: [input.subscriptionId],
          }
        : {},
    ),
  });

  const payload = (await response.json().catch(() => ({}))) as PaddlePortalResponse;

  if (!response.ok) {
    throw new Error(payload.error?.detail ?? payload.error?.message ?? "Could not create Paddle customer portal session.");
  }

  const subscriptionLink = payload.data?.urls?.subscriptions?.[0]?.links?.overview;
  const overviewLink = payload.data?.urls?.general?.overview;

  if (!overviewLink && !subscriptionLink) {
    throw new Error("Paddle customer portal session did not include a portal URL.");
  }

  return subscriptionLink ?? overviewLink ?? "";
}

export async function retrievePaddleSubscription(subscriptionId: string): Promise<PaddleSubscriptionData> {
  const response = await fetch(`${getPaddleApiBaseUrl()}/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${getPaddleApiKey()}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as PaddleApiSubscriptionResponse;

  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.detail ?? payload.error?.message ?? "Could not retrieve Paddle subscription.");
  }

  return payload.data;
}

export function paddleSubscriptionDataToSnapshot(input: {
  data: PaddleSubscriptionData;
  eventId?: string | null;
  occurredAt?: string | null;
  testMode?: boolean;
}): PaddleSubscriptionSnapshot {
  const firstItem = input.data.items?.[0];
  const status = input.data.status ?? "inactive";
  const scheduledChange = input.data.scheduled_change ?? null;
  const action =
    typeof scheduledChange === "object" && scheduledChange !== null && "action" in scheduledChange
      ? String((scheduledChange as { action?: unknown }).action)
      : null;

  return {
    paddleSubscriptionId: input.data.id,
    paddleCustomerId: input.data.customer_id ?? null,
    paddlePriceId: firstItem?.price?.id ?? null,
    paddleProductId: firstItem?.product?.id ?? firstItem?.price?.product_id ?? null,
    status,
    currentBillingPeriodStartsAt: input.data.current_billing_period?.starts_at ?? null,
    currentBillingPeriodEndsAt: input.data.current_billing_period?.ends_at ?? null,
    scheduledChange,
    cancelAtPeriodEnd: action === "cancel",
    collectionMode: input.data.collection_mode ?? null,
    currencyCode: input.data.currency_code ?? null,
    testMode: Boolean(input.testMode),
    lastEventId: input.eventId ?? null,
    lastEventOccurredAt: input.occurredAt ?? null,
  };
}
