"use client";

import { Settings } from "lucide-react";
import { useState } from "react";

export function ManageBillingButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleManageBilling() {
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/paddle/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json()) as { url?: string | null; message?: string };

      if (response.status === 401) {
        window.location.assign("/login?next=/account");
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      setMessage(data.message || "Could not open billing portal.");
    } catch {
      setMessage("Could not open billing portal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleManageBilling}
        disabled={isLoading}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-6 py-4 text-lg font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 sm:w-auto"
      >
        <Settings aria-hidden="true" className="h-5 w-5" />
        {isLoading ? "Opening billing..." : "Manage Billing"}
      </button>
      {message ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-base text-amber-950">{message}</p> : null}
    </div>
  );
}
