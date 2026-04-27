import Link from "next/link";

import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-800">Policy</p>
        <h1 className="mt-3 text-4xl font-bold tracking-normal text-zinc-950">Refund Policy</h1>
        <p className="mt-4 text-base text-zinc-500">Last updated: April 27, 2026</p>

        <div className="mt-8 space-y-8 text-lg leading-8 text-zinc-700">
          <section>
            <p>
              ScamGate AI is a digital subscription-based software service that provides educational scam-risk signals
              for suspicious messages and links.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-950">Subscription Cancellations</h2>
            <p className="mt-3">
              You may cancel your subscription at any time through your account billing portal. After cancellation, you
              will generally continue to have access to paid features until the end of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-950">Refunds</h2>
            <p className="mt-3">
              Because ScamGate AI is a digital service, subscription payments are generally non-refundable once a
              billing period has started. However, we may review refund requests on a case-by-case basis for duplicate
              charges, billing errors, accidental purchases, or where required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-950">No Guarantee of Scam Detection</h2>
            <p className="mt-3">
              ScamGate AI provides educational risk assessments only. We do not guarantee that all scams will be
              detected, do not provide legal, financial, tax, or investment advice, and do not recover lost funds.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-950">How to Request a Refund</h2>
            <p className="mt-3">
              To request a refund review, please contact us at{" "}
              <Link className="font-semibold text-emerald-800 hover:text-emerald-900" href="mailto:support@scamgate-ai.com">
                support@scamgate-ai.com
              </Link>{" "}
              with your account email, payment date, and a brief explanation of your request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-950">Changes to This Policy</h2>
            <p className="mt-3">
              We may update this Refund Policy from time to time. The updated version will be posted on this page.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
