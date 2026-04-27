import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-normal text-zinc-950">Privacy Policy</h1>
        <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-700">
          <p>
            ScamGate AI uses submitted content to generate educational scam-risk signals. This may include messages,
            links, or emails you choose to submit.
          </p>
          <p>
            Do not submit complete passwords, Social Security numbers, full bank card numbers, verification codes, or
            other sensitive personal information.
          </p>
          <p>
            ScamGate does not guarantee that every scam will be detected. You should not rely on ScamGate as your only
            judgment before sending money, clicking links, or sharing personal information.
          </p>
          <p>
            If Supabase is configured, ScamGate may save check history and usage events to improve the product.
          </p>
          <p>Users can contact the site administrator to request deletion of stored records.</p>
        </div>
      </main>
    </div>
  );
}
