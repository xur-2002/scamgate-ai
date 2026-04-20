import { Info } from "lucide-react";

export function Disclaimer() {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <div className="flex gap-3">
        <Info aria-hidden="true" className="mt-1 h-5 w-5 flex-none" />
        <p className="text-base leading-7">
          ScamGate provides educational risk signals only. It does not guarantee fraud detection, does not recover lost
          funds, and does not provide legal, financial, or investment advice. Do not submit SSN, full card numbers,
          passwords, verification codes, or sensitive personal information.
        </p>
      </div>
    </section>
  );
}
