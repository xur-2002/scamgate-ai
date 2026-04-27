import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/entitlements";

export async function Header() {
  const user = await getCurrentUser();
  const plan = await getUserPlan(user?.id);
  const isLoggedIn = Boolean(user);
  const isPro = plan === "pro";

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-zinc-950">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          </span>
          <span className="min-w-0 text-xl font-bold tracking-normal">ScamGate AI</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 text-base font-medium text-zinc-700 md:flex">
          <Link className="hover:text-zinc-950" href="/check">
            Check
          </Link>
          <Link className="hover:text-zinc-950" href="/pricing">
            Pricing
          </Link>
          <Link className="hover:text-zinc-950" href="/privacy">
            Privacy
          </Link>
          {isLoggedIn ? (
            <Link className="hover:text-zinc-950" href="/account">
              Account
            </Link>
          ) : (
            <Link className="hover:text-zinc-950" href="/login">
              Login
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <form action="/auth/logout" method="post">
              <button type="submit" className="hidden min-h-12 px-3 py-2 text-base font-semibold text-zinc-700 hover:text-zinc-950 sm:inline-flex">
                Logout
              </button>
            </form>
          ) : (
            <Link className="hidden min-h-12 items-center px-3 py-2 text-base font-semibold text-zinc-700 hover:text-zinc-950 sm:inline-flex" href="/login">
              Login
            </Link>
          )}
          <Link
            href={isPro ? "/account" : "/pricing"}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-zinc-950 px-4 py-3 text-base font-semibold text-white hover:bg-zinc-800 sm:px-5"
          >
            {isPro ? "Manage Billing" : "Upgrade"}
          </Link>
        </div>
      </div>
    </header>
  );
}
