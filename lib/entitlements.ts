import { planForPaddleSubscription } from "@/lib/db";
import { getSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

export type AccountSummary = {
  plan: Plan;
  subscriptionStatus: string | null;
  currentBillingPeriodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  paddleCustomerId: string | null;
  testMode: boolean;
};

export async function getUserPlan(userId: string | null | undefined): Promise<Plan> {
  if (!userId || !isSupabaseConfigured()) {
    return "free";
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return "free";
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || profile?.plan !== "pro") {
    return "free";
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("status, current_billing_period_ends_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) {
    return "free";
  }

  return planForPaddleSubscription(subscription?.status, subscription?.current_billing_period_ends_at);
}

export async function getAccountSummary(userId: string): Promise<AccountSummary> {
  if (!isSupabaseConfigured()) {
    return {
      plan: "free",
      subscriptionStatus: null,
      currentBillingPeriodEndsAt: null,
      cancelAtPeriodEnd: false,
      paddleCustomerId: null,
      testMode: false,
    };
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return {
      plan: "free",
      subscriptionStatus: null,
      currentBillingPeriodEndsAt: null,
      cancelAtPeriodEnd: false,
      paddleCustomerId: null,
      testMode: false,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, paddle_customer_id")
    .eq("id", userId)
    .maybeSingle();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_billing_period_ends_at, cancel_at_period_end, test_mode")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscriptionPlan = planForPaddleSubscription(
    subscription?.status,
    subscription?.current_billing_period_ends_at,
  );
  const plan = profile?.plan === "pro" && subscriptionPlan === "pro" ? "pro" : "free";

  return {
    plan,
    subscriptionStatus: subscription?.status ?? null,
    currentBillingPeriodEndsAt: subscription?.current_billing_period_ends_at ?? null,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    paddleCustomerId: profile?.paddle_customer_id ?? null,
    testMode: Boolean(subscription?.test_mode),
  };
}
