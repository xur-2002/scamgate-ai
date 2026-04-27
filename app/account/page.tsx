import { redirect } from "next/navigation";

import { Header } from "@/components/Header";
import { ManageBillingButton } from "@/components/ManageBillingButton";
import { UpgradeButton } from "@/components/UpgradeButton";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfileForUser } from "@/lib/db";
import { getAccountSummary } from "@/lib/entitlements";

type AccountPageProps = {
  searchParams: Promise<{
    checkout?: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  await ensureProfileForUser(user);

  const summary = await getAccountSummary(user.id);
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-800">Account</p>
        <h1 className="mt-3 text-4xl font-bold tracking-normal text-zinc-950">Your ScamGate plan</h1>
        <p className="mt-4 text-lg leading-8 text-zinc-700">
          Manage your login, plan, and Paddle Customer Portal from one place.
        </p>

        {params.checkout === "success" ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-lg text-emerald-950">
            Checkout completed. Your Pro access updates after Paddle confirms the subscription webhook.
          </div>
        ) : null}

        <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-zinc-500">Email</p>
              <p className="mt-2 break-words text-lg font-semibold text-zinc-950">{user.email ?? "Signed in"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-zinc-500">Plan</p>
              <p className="mt-2 text-lg font-semibold capitalize text-zinc-950">{summary.plan}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-zinc-500">Subscription status</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">{summary.subscriptionStatus ?? "None"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-zinc-500">Current period ends</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">
                {formatDate(summary.currentBillingPeriodEndsAt)}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-zinc-500">Test mode</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">{summary.testMode ? "Yes" : "No"}</p>
            </div>
          </div>

          {summary.cancelAtPeriodEnd && summary.currentBillingPeriodEndsAt ? (
            <p className="mt-6 rounded-lg bg-amber-50 p-4 text-base leading-7 text-amber-950">
              Your subscription is scheduled to cancel at the end of this billing period.
            </p>
          ) : null}

          <div className="mt-7">
            {summary.plan === "pro" ? (
              <ManageBillingButton />
            ) : (
              <UpgradeButton
                isLoggedIn={true}
                userId={user.id}
                userEmail={user.email}
                nextPath="/account"
                label="Upgrade to Pro - $9/month"
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
