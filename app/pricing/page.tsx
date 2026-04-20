import { Header } from "@/components/Header";
import { PricingCard } from "@/components/PricingCard";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-800">Pricing</p>
          <h1 className="mt-3 text-4xl font-bold tracking-normal text-zinc-950">More checks for peace of mind.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-700">
            The MVP includes 3 free checks per day. Pro is designed for households and caregivers who want more frequent
            scam checks.
          </p>
          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5 text-lg leading-8 text-amber-950">
            Payments require Stripe keys. In local demo mode, the upgrade button returns a friendly configuration
            message instead of crashing.
          </div>
        </section>
        <PricingCard />
      </main>
    </div>
  );
}
