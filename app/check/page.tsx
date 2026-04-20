import { CheckerTabs } from "@/components/CheckerTabs";
import { Disclaimer } from "@/components/Disclaimer";
import { Header } from "@/components/Header";

export default function CheckPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-5 py-10 sm:px-6 lg:px-8">
        <div className="min-w-0 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-800">Scam Checker</p>
          <h1 className="mt-3 break-words text-3xl font-bold tracking-normal text-zinc-950 sm:text-4xl">
            Check before you click or pay.
          </h1>
          <p className="mt-4 break-words text-lg leading-8 text-zinc-700">
            Paste suspicious content or check a link. Do not submit SSN, full card numbers, complete passwords,
            verification codes, or sensitive personal information.
          </p>
        </div>
        <div className="mt-8">
          <CheckerTabs />
        </div>
        <div className="mt-8">
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
