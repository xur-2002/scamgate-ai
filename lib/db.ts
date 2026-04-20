import type { Stripe } from "stripe";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { AnalysisResult, AnalyzeRequest, RuleResult } from "@/lib/types";

type SaveCheckInput = {
  request: AnalyzeRequest;
  result: AnalysisResult;
  ruleResult: RuleResult;
};

export async function saveCheck({ request, result, ruleResult }: SaveCheckInput): Promise<void> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const rawText =
    request.inputType === "screenshot"
      ? request.content || "Screenshot uploaded. Image data is not stored by this MVP."
      : request.content;

  const { error } = await supabase.from("checks").insert({
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
  });

  if (error) {
    console.warn("Failed to save ScamGate check to Supabase.", error);
  }
}

export async function recordUsageEvent(input: {
  anonymousId?: string;
  ipHash?: string;
  eventType: string;
}): Promise<void> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("usage_events").insert({
    anonymous_id: input.anonymousId ?? null,
    ip_hash: input.ipHash ?? null,
    event_type: input.eventType,
  });

  if (error) {
    console.warn("Failed to record usage event.", error);
  }
}

export async function getUsageCountToday(input: {
  anonymousId?: string;
  ipHash?: string;
  resetDate: string;
}): Promise<number | null> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return null;
  }

  const identityColumn = input.anonymousId ? "anonymous_id" : "ip_hash";
  const identityValue = input.anonymousId ?? input.ipHash;

  if (!identityValue) {
    return null;
  }

  const { count, error } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "check_completed")
    .eq(identityColumn, identityValue)
    .gte("created_at", input.resetDate);

  if (error) {
    console.warn("Failed to read usage count.", error);
    return null;
  }

  return count ?? 0;
}

export async function saveSubscriptionFromCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;
  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : null;

  const { error } = await supabase.from("subscriptions").insert({
    email,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    plan: "pro",
    status: "active",
  });

  if (error) {
    console.warn("Failed to save subscription.", error);
  }
}
