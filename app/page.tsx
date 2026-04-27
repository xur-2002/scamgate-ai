import { LinkIcon, MessageSquareText, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { FeatureCard } from "@/components/FeatureCard";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";

const steps = [
  "Step 1: Paste text or a link",
  "Step 2: AI checks for scam signals",
  "Step 3: Get a simple risk result",
];

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />

        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-normal text-zinc-950">Fast checks for common scam channels</h2>
            <p className="mt-4 text-lg leading-8 text-zinc-700">
              ScamGate is built for everyday internet users who want a clear warning before clicking, paying, or sharing
              private information.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={MessageSquareText}
              title="Paste suspicious text"
              description="Check texts, emails, marketplace messages, or chats for risky language."
            />
            <FeatureCard
              icon={LinkIcon}
              title="Check suspicious links"
              description="Look for fake brand domains, shortened links, and pressure tactics."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Get plain-English guidance"
              description="See a clear risk level, red flags, and the safest next step."
            />
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-zinc-50">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-normal text-zinc-950">How it works</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step} className="rounded-lg border border-zinc-200 bg-white p-5 text-xl font-bold text-zinc-950">
                  {step}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
          <Disclaimer />
          <div className="mt-8 flex flex-col items-start gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-950">Ready to check a message?</h2>
              <p className="mt-2 text-lg text-zinc-700">Start with 3 free checks today.</p>
            </div>
            <Link
              href="/check"
              className="inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-emerald-700 px-7 py-4 text-lg font-semibold text-white hover:bg-emerald-800 sm:w-auto"
            >
              Start Free Check
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
