import type { User } from "@supabase/supabase-js";

import type { PaddleSubscriptionSnapshot } from "@/lib/paddle/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { AnalysisResult, AnalyzeRequest, RuleResult } from "@/lib/types";

type SaveCheckInput = {
  request: AnalyzeRequest;
  result: AnalysisResult;
  ruleResult: RuleResult;
  userId?: string;
  anonymousId?: string;
};

export type ProfileRecord = {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string;
  paddle_customer_id: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SubscriptionRecord = {
  id: string;
  user_id: string;
  paddle_customer_id: string | null;
  paddle_subscription_id: string;
  paddle_price_id: string | null;
  paddle_product_id: string | null;
  status: string;
  plan: string;
  current_billing_period_starts_at: string | null;
  current_billing_period_ends_at: string | null;
  scheduled_change: unknown;
  cancel_at_period_end: boolean;
  collection_mode: string | null;
  currency_code: string | null;
  test_mode: boolean;
  last_event_id: string | null;
  last_event_occurred_at: string | null;
  created_at?: string;
  updated_at?: string;
};

const PADDLE_PRO_STATUSES = new Set(["active", "trialing"]);
const PADDLE_FREE_STATUSES = new Set(["past_due", "paused", "deleted", "expired", "unpaid", "inactive"]);

function hasFutureDate(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function isOlderEvent(existing: string | null | undefined, incoming: string | null | undefined): boolean {
  if (!existing || !incoming) {
    return false;
  }

  const existingTime = new Date(existing).getTime();
  const incomingTime = new Date(incoming).getTime();

  return Number.isFinite(existingTime) && Number.isFinite(incomingTime) && incomingTime < existingTime;
}

export function planForPaddleSubscription(status: string | null | undefined, currentPeriodEndsAt?: string | null): "free" | "pro" {
  if (!status) {
    return "free";
  }

  if (PADDLE_PRO_STATUSES.has(status)) {
    return "pro";
  }

  if (status === "canceled" && hasFutureDate(currentPeriodEndsAt)) {
    return "pro";
  }

  if (PADDLE_FREE_STATUSES.has(status)) {
    return "free";
  }

  return "free";
}

export async function ensureProfileForUser(user: User): Promise<ProfileRecord | null> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return null;
  }

  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("id, email, full_name, plan, paddle_customer_id, created_at, updated_at")
    .single();

  if (error) {
    console.warn("Failed to ensure profile.", error.message);
    return null;
  }

  return data as ProfileRecord;
}

export async function getProfileByUserId(userId: string): Promise<ProfileRecord | null> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, plan, paddle_customer_id, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to read profile.", error.message);
    return null;
  }

  return (data as ProfileRecord | null) ?? null;
}

export async function getProfileByPaddleCustomerId(customerId: string): Promise<ProfileRecord | null> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, plan, paddle_customer_id, created_at, updated_at")
    .eq("paddle_customer_id", customerId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to read profile by Paddle customer.", error.message);
    return null;
  }

  return (data as ProfileRecord | null) ?? null;
}

export async function setProfilePaddleCustomerId(userId: string, customerId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      paddle_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.warn("Failed to save Paddle customer ID.", error.message);
  }
}

export async function setProfilePlan(userId: string, plan: "free" | "pro"): Promise<void> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      plan,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.warn("Failed to update profile plan.", error.message);
  }
}

export async function saveCheck({ request, result, ruleResult, userId, anonymousId }: SaveCheckInput): Promise<void> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const rawText =
    request.inputType === "screenshot"
      ? request.content || "Screenshot uploaded. Image data is not stored by this MVP."
      : request.content;

  const { error } = await supabase.from("checks").insert({
    user_id: userId ?? null,
    anonymous_id: anonymousId ?? request.anonymousId ?? null,
    input_type: request.inputType,
    raw_text: rawText,
    extracted_urls: ruleResult.extractedUrls,
    risk_score: result.risk_score,
    risk_level: result.risk_level,
    scam_type: result.scam_type,
    red_flags: result.red_flags,
    plain_english_explanation: result.plain_english_explanation,
    recommended_action: result.recommended_action,
    safe_next_step: result.safe_next_step,
    confidence: result.confidence,
    provider_used: result.provider_used ?? null,
  });

  if (error) {
    console.warn("Failed to save ScamGate check to Supabase.", error.message);
  }
}

export async function recordUsageEvent(input: {
  userId?: string;
  anonymousId?: string;
  ipHash?: string;
  eventType: string;
}): Promise<void> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("usage_events").insert({
    user_id: input.userId ?? null,
    anonymous_id: input.anonymousId ?? null,
    ip_hash: input.ipHash ?? null,
    event_type: input.eventType,
  });

  if (error) {
    console.warn("Failed to record usage event.", error.message);
  }
}

export async function getUsageCountToday(input: {
  userId?: string;
  anonymousId?: string;
  ipHash?: string;
  resetDate: string;
}): Promise<number | null> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return null;
  }

  let query = supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "check_completed")
    .gte("created_at", input.resetDate);

  if (input.userId) {
    query = query.eq("user_id", input.userId);
  } else if (input.anonymousId) {
    query = query.eq("anonymous_id", input.anonymousId);
  } else if (input.ipHash) {
    query = query.eq("ip_hash", input.ipHash);
  } else {
    return null;
  }

  const { count, error } = await query;

  if (error) {
    console.warn("Failed to read usage count.", error.message);
    return null;
  }

  return count ?? 0;
}

export async function upsertPaddleSubscription(
  input: PaddleSubscriptionSnapshot & { userId: string },
): Promise<void> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const { data: existing, error: readError } = await supabase
    .from("subscriptions")
    .select("last_event_occurred_at")
    .eq("paddle_subscription_id", input.paddleSubscriptionId)
    .maybeSingle();

  if (readError) {
    console.warn("Failed to read existing Paddle subscription.", readError.message);
  }

  if (isOlderEvent(existing?.last_event_occurred_at, input.lastEventOccurredAt)) {
    return;
  }

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: input.userId,
      paddle_customer_id: input.paddleCustomerId,
      paddle_subscription_id: input.paddleSubscriptionId,
      paddle_price_id: input.paddlePriceId,
      paddle_product_id: input.paddleProductId,
      status: input.status,
      plan: "pro",
      current_billing_period_starts_at: input.currentBillingPeriodStartsAt,
      current_billing_period_ends_at: input.currentBillingPeriodEndsAt,
      scheduled_change: input.scheduledChange,
      cancel_at_period_end: input.cancelAtPeriodEnd,
      collection_mode: input.collectionMode,
      currency_code: input.currencyCode,
      test_mode: input.testMode,
      last_event_id: input.lastEventId,
      last_event_occurred_at: input.lastEventOccurredAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );

  if (error) {
    console.warn("Failed to upsert Paddle subscription.", error.message);
    return;
  }

  if (input.paddleCustomerId) {
    await setProfilePaddleCustomerId(input.userId, input.paddleCustomerId);
  }

  await setProfilePlan(
    input.userId,
    planForPaddleSubscription(input.status, input.currentBillingPeriodEndsAt),
  );
}

export async function getLatestSubscriptionForUser(userId: string): Promise<SubscriptionRecord | null> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, user_id, paddle_customer_id, paddle_subscription_id, paddle_price_id, paddle_product_id, status, plan, current_billing_period_starts_at, current_billing_period_ends_at, scheduled_change, cancel_at_period_end, collection_mode, currency_code, test_mode, last_event_id, last_event_occurred_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Failed to read latest Paddle subscription.", error.message);
    return null;
  }

  return (data as SubscriptionRecord | null) ?? null;
}
