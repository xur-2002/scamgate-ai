"use client";

import { Mail } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError("Supabase Auth is not configured yet. Add Supabase environment variables to enable login.");
      return;
    }

    setIsLoading(true);

    try {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
      const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setMessage("Check your email for a secure login link.");
    } catch {
      setError("Could not send the login link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <label htmlFor="email" className="text-lg font-bold text-zinc-950">
        Email address
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        required
        className="mt-3 min-h-14 w-full rounded-lg border border-zinc-300 px-4 py-3 text-lg text-zinc-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        <Mail aria-hidden="true" className="h-5 w-5" />
        {isLoading ? "Sending login link..." : "Send Magic Link"}
      </button>

      {message ? <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-base text-emerald-950">{message}</p> : null}
      {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-base text-red-900">{error}</p> : null}
    </form>
  );
}
