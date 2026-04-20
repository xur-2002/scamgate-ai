import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export function Header() {
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
        </nav>

        <Link
          href="/check"
          className="hidden min-h-12 items-center justify-center rounded-lg bg-zinc-950 px-5 py-3 text-base font-semibold text-white hover:bg-zinc-800 sm:inline-flex"
        >
          Start Free Check
        </Link>
      </div>
    </header>
  );
}
