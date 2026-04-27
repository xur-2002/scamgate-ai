"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { UpgradeButton } from "@/components/UpgradeButton";
import type { Plan } from "@/lib/entitlements";

type PricingCardProps = {
  isLoggedIn: boolean;
  userId?: string | null;
  userEmail?: string | null;
  currentPlan: Plan;
};

const freeFeatures = ["3 scam checks per day", "Text and link checking", "Basic plain-English risk explanation"];
const proFeatures = [
  "100 scam checks per day during beta",
  "Text and link checking",
  "Higher usage limit",
  "Future screenshot and history access",
];

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="mt-6 space-y-3 text-base leading-7 text-zinc-700">
      {features.map((feature) => (
        <li key={feature} className="flex gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export function PricingCard({ isLoggedIn, userId, userEmail, currentPlan }: PricingCardProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-bold text-zinc-950">Free</p>
            <p className="text-zinc-600">$0</p>
          </div>
        </div>

        <FeatureList features={freeFeatures} />

        <Link
          href="/check"
          className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-4 text-lg font-semibold text-zinc-950 hover:bg-zinc-50"
        >
          Start Free Check
        </Link>
      </section>

      <section className="rounded-lg border-2 border-emerald-700 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-bold text-zinc-950">ScamGate Pro</p>
            <p className="text-zinc-600">$9/month</p>
          </div>
        </div>

        <FeatureList features={proFeatures} />

        {currentPlan === "pro" ? (
          <Link
            href="/account"
            className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-800"
          >
            Pro active
          </Link>
        ) : (
          <div className="mt-7">
            <UpgradeButton isLoggedIn={isLoggedIn} userId={userId} userEmail={userEmail} nextPath="/pricing" />
          </div>
        )}
      </section>
    </div>
  );
}
