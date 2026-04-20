import { AlertTriangle, LinkIcon, MailWarning, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="border-b border-zinc-200 bg-[linear-gradient(180deg,#f7fbf9_0%,#ffffff_62%)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 sm:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            ScamGate AI
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-zinc-950 sm:text-5xl">
            Check suspicious messages before you click.
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-zinc-700">
            Paste a suspicious message, link, or email. ScamGate gives you a simple scam-risk rating in plain English.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/check"
              className="inline-flex min-h-14 items-center justify-center rounded-lg bg-emerald-700 px-7 py-4 text-lg font-semibold text-white hover:bg-emerald-800"
            >
              Start Free Check
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-14 items-center justify-center rounded-lg border border-zinc-300 bg-white px-7 py-4 text-lg font-semibold text-zinc-950 hover:bg-zinc-50"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div>
              <p className="text-sm font-semibold text-zinc-500">Example result</p>
              <p className="mt-1 text-2xl font-bold text-red-700">High Risk</p>
            </div>
            <AlertTriangle aria-hidden="true" className="h-10 w-10 text-red-600" />
          </div>
          <div className="space-y-4 pt-5">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-900">Do not click. Do not pay.</p>
              <p className="mt-2 text-base leading-7 text-red-900">
                Verify through the official website or phone number you type yourself.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 p-4">
                <MailWarning aria-hidden="true" className="h-6 w-6 text-amber-600" />
                <p className="mt-3 font-semibold text-zinc-950">Urgent payment</p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4">
                <LinkIcon aria-hidden="true" className="h-6 w-6 text-emerald-700" />
                <p className="mt-3 font-semibold text-zinc-950">Suspicious link</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
