"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";

import { openPaddleCheckout } from "@/lib/paddle/client";

type UpgradeButtonProps = {
  isLoggedIn: boolean;
  userId?: string | null;
  userEmail?: string | null;
  className?: string;
  label?: string;
  nextPath?: string;
};

export function UpgradeButton({
  isLoggedIn,
  userId,
  userEmail,
  className,
  label = "Upgrade to Pro - $9/month",
  nextPath = "/pricing",
}: UpgradeButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpgrade() {
    setMessage(null);

    if (!isLoggedIn) {
      window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    if (!userId || !userEmail) {
      setMessage("Please log in again before upgrading.");
      return;
    }

    setIsLoading(true);

    try {
      await openPaddleCheckout({
        userId,
        email: userEmail,
        nextPath: "/account",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Paddle Checkout is not configured in this environment.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={isLoading}
        className={
          className ??
          "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-6 py-4 text-lg font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        }
      >
        <CreditCard aria-hidden="true" className="h-5 w-5" />
        {isLoading ? "Opening checkout..." : label}
      </button>
      {message ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-base text-amber-950">{message}</p> : null}
    </div>
  );
}
