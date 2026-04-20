import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AnalysisResult, RiskLevel } from "@/lib/types";

const levelCopy: Record<RiskLevel, string> = {
  low: "Low Risk",
  medium: "Suspicious",
  high: "High Risk",
};

const levelClasses: Record<RiskLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-950",
  medium: "border-amber-200 bg-amber-50 text-amber-950",
  high: "border-red-200 bg-red-50 text-red-950",
};

const levelIcon = {
  low: CheckCircle2,
  medium: ShieldAlert,
  high: AlertTriangle,
};

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ResultCard({ result }: { result: AnalysisResult }) {
  const Icon = levelIcon[result.risk_level];

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className={cn("rounded-lg border p-5", levelClasses[result.risk_level])}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Icon aria-hidden="true" className="h-9 w-9 flex-none" />
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-normal">Risk Level</p>
              <h2 className="text-3xl font-bold tracking-normal">{levelCopy[result.risk_level]}</h2>
            </div>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-sm font-semibold text-zinc-500">Risk Score</p>
            <p className="text-3xl font-bold text-zinc-950">{result.risk_score}</p>
          </div>
        </div>

        {result.risk_level === "high" ? (
          <p className="mt-5 rounded-lg bg-white p-4 text-lg font-bold text-red-800">
            Do not click. Do not pay. Verify through the official website or phone number.
          </p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm font-semibold text-zinc-500">Scam Type</p>
          <p className="mt-1 break-words text-lg font-bold text-zinc-950">{formatLabel(result.scam_type)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm font-semibold text-zinc-500">Confidence</p>
          <p className="mt-1 break-words text-lg font-bold text-zinc-950">{formatLabel(result.confidence)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm font-semibold text-zinc-500">Recommended Action</p>
          <p className="mt-1 break-words text-lg font-bold text-zinc-950">{result.recommended_action}</p>
        </div>
      </div>

      {process.env.NODE_ENV === "development" && result.provider_used ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-500">Development Provider</p>
          <p className="mt-1 break-words text-lg font-bold text-zinc-950">{result.provider_used}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h3 className="text-xl font-bold text-zinc-950">Red Flags</h3>
          <ul className="mt-3 space-y-3">
            {result.red_flags.map((flag) => (
              <li key={flag} className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-base text-zinc-800">
                <AlertTriangle aria-hidden="true" className="mt-1 h-5 w-5 flex-none text-amber-600" />
                <span className="min-w-0 break-words">{flag}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-bold text-zinc-950">Plain English Explanation</h3>
            <p className="mt-3 break-words text-lg leading-8 text-zinc-700">{result.plain_english_explanation}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="text-xl font-bold text-emerald-950">Safe Next Step</h3>
            <p className="mt-2 break-words text-lg leading-8 text-emerald-950">{result.safe_next_step}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
