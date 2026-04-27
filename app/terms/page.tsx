import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-normal text-zinc-950">Terms of Service</h1>
        <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-700">
          <p>ScamGate AI is provided for educational purposes only.</p>
          <p>ScamGate does not provide legal advice, financial advice, investment advice, or fraud recovery services.</p>
          <p>
            ScamGate does not guarantee that a message, link, or email is safe or unsafe. Low risk only means fewer
            warning signs were found.
          </p>
          <p>
            Users are responsible for verifying suspicious communications through official channels, such as websites or
            phone numbers typed manually.
          </p>
          <p>
            If a message asks for money, verification codes, passwords, remote access, gift cards, crypto, or secrecy,
            stop and verify with a trusted person or official source.
          </p>
        </div>
      </main>
    </div>
  );
}
