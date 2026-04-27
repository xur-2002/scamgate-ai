import { Header } from "@/components/Header";
import { PricingCard } from "@/components/PricingCard";
import { getCurrentUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/entitlements";

type PricingPageProps = {
  searchParams: Promise<{
    checkout?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const user = await getCurrentUser();
  const plan = await getUserPlan(user?.id);
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-800">Pricing</p>
          <h1 className="mt-3 text-4xl font-bold tracking-normal text-zinc-950">More checks for peace of mind.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-700">
            The MVP includes 3 free checks per day. Pro is designed for households and caregivers who want more frequent
            scam checks.
          </p>
          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5 text-lg leading-8 text-amber-950">
            Payments require Paddle and Supabase configuration. In local demo mode, checkout returns a clear setup
            message instead of crashing.
          </div>
          {params.checkout === "canceled" ? (
            <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-5 text-lg leading-8 text-zinc-700">
              Checkout was canceled. You can keep using your free scam checks.
            </div>
          ) : null}
        </section>
        <div className="mt-8">
          <PricingCard isLoggedIn={Boolean(user)} userId={user?.id} userEmail={user?.email} currentPlan={plan} />
        </div>
      </main>
    </div>
  );
}
