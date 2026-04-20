"use client";

import { CreditCard, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { getOrCreateAnonymousId } from "@/lib/client-identity";

type CheckoutResponse = {
  configured?: boolean;
  url?: string | null;
  message?: string;
};

export function PricingCard() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpgrade() {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousId: getOrCreateAnonymousId() }),
      });
      const data = (await response.json()) as CheckoutResponse;

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      setMessage(data.message || "Payments are not configured in this local demo.");
    } catch {
      setMessage("Payments are not configured in this local demo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
          <ShieldCheck aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-lg font-bold text-zinc-950">ScamGate Pro</p>
          <p className="text-zinc-600">$9/month</p>
        </div>
      </div>

      <ul className="mt-6 space-y-3 text-base leading-7 text-zinc-700">
        <li>More scam checks each day</li>
        <li>Text and link checks</li>
        <li>Plain-English recommendations</li>
      </ul>

      <button
        type="button"
        onClick={handleUpgrade}
        disabled={isLoading}
        className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-6 py-4 text-lg font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        <CreditCard aria-hidden="true" className="h-5 w-5" />
        {isLoading ? "Opening checkout..." : "Upgrade to Pro - $9/month"}
      </button>

      {message ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-base text-amber-950">{message}</p> : null}
    </section>
  );
}
