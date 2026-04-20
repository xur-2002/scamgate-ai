"use client";

import { LinkIcon, MessageSquareText, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/LoadingState";
import { ResultCard } from "@/components/ResultCard";
import { getOrCreateAnonymousId } from "@/lib/client-identity";
import type { AnalysisResult, InputType } from "@/lib/types";

const LOCAL_USAGE_KEY = "scamgate_local_usage";
const PRO_KEY = "scamgate_pro";

type TabId = Exclude<InputType, "screenshot">;

type ApiMessage = {
  message: string;
};

type LocalUsage = {
  date: string;
  count: number;
};

const tabs: Array<{ id: TabId; label: string; icon: typeof MessageSquareText }> = [
  { id: "text", label: "Text", icon: MessageSquareText },
  { id: "url", label: "Link", icon: LinkIcon },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getLocalUsage(): LocalUsage {
  if (typeof window === "undefined") {
    return { date: getTodayKey(), count: 0 };
  }

  const stored = window.localStorage.getItem(LOCAL_USAGE_KEY);
  const today = getTodayKey();

  if (!stored) {
    return { date: today, count: 0 };
  }

  try {
    const parsed = JSON.parse(stored) as LocalUsage;
    return parsed.date === today ? parsed : { date: today, count: 0 };
  } catch {
    return { date: today, count: 0 };
  }
}

function setLocalUsage(usage: LocalUsage) {
  window.localStorage.setItem(LOCAL_USAGE_KEY, JSON.stringify(usage));
}

function hasMessage(value: unknown): value is ApiMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as { message?: unknown }).message === "string"
  );
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function CheckerTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("text");
  const [textValue, setTextValue] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [localUsage, setLocalUsageState] = useState<LocalUsage>({ date: getTodayKey(), count: 0 });
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);

      if (params.get("upgraded") === "1") {
        window.localStorage.setItem(PRO_KEY, "true");
        setNotice("Upgrade successful. Pro mode is enabled for this browser.");
      }

      if (params.get("canceled") === "1") {
        setNotice("Checkout was canceled. You can keep using your free checks.");
      }

      setIsPro(window.localStorage.getItem(PRO_KEY) === "true");
      setLocalUsageState(getLocalUsage());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const remainingChecks = useMemo(() => Math.max(0, 3 - localUsage.count), [localUsage.count]);

  function incrementLocalUsage() {
    if (isPro) {
      return;
    }

    const current = getLocalUsage();
    const next = {
      date: current.date,
      count: current.count + 1,
    };
    setLocalUsage(next);
    setLocalUsageState(next);
  }

  function showPaywall() {
    setPaywallVisible(true);
    setError(null);
    setResult(null);
  }

  async function handleUpgrade() {
    setNotice(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousId: getOrCreateAnonymousId() }),
      });
      const data = (await response.json()) as { url?: string | null; message?: string };

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      setNotice(data.message || "Payments are not configured in this local demo.");
    } catch {
      setNotice("Payments are not configured in this local demo.");
    }
  }

  async function submitCheck(inputType: TabId) {
    setError(null);
    setNotice(null);
    setPaywallVisible(false);
    setResult(null);

    const usage = getLocalUsage();

    if (!isPro && usage.count >= 3) {
      setLocalUsageState(usage);
      showPaywall();
      return;
    }

    const content = inputType === "text" ? textValue.trim() : linkValue.trim();

    if (inputType === "text" && !content) {
      setError("Please paste a suspicious message, email, or chat first.");
      return;
    }

    if (inputType === "url" && !content) {
      setError("Please enter a link to check.");
      return;
    }

    if (inputType === "url" && !isHttpUrl(content)) {
      setError("Please enter a valid URL that starts with http:// or https://.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputType,
          content,
          anonymousId: getOrCreateAnonymousId(),
        }),
      });
      const data: unknown = await response.json();

      if (response.status === 429) {
        showPaywall();
        return;
      }

      if (!response.ok) {
        setError(hasMessage(data) ? data.message : "ScamGate could not complete this check. Please try again.");
        return;
      }

      setResult(data as AnalysisResult);
      incrementLocalUsage();
    } catch {
      setError("ScamGate could not reach the analysis service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="min-w-0 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap gap-2 rounded-lg bg-zinc-100 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setError(null);
                  setResult(null);
                  setPaywallVisible(false);
                }}
                className={`inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-semibold ${
                  active ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-600 hover:bg-white"
                }`}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {activeTab === "text" ? (
            <div>
              <label htmlFor="text-check" className="text-lg font-bold text-zinc-950">
                Paste suspicious text
              </label>
              <textarea
                id="text-check"
                value={textValue}
                onChange={(event) => setTextValue(event.target.value)}
                placeholder="Paste a suspicious text message, email, marketplace message, or chat here..."
                className="mt-3 min-h-56 w-full rounded-lg border border-zinc-300 bg-white p-4 text-lg leading-8 text-zinc-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => void submitCheck("text")}
                disabled={isLoading}
                className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                Check for Scam
              </button>
            </div>
          ) : null}

          {activeTab === "url" ? (
            <div>
              <label htmlFor="link-check" className="text-lg font-bold text-zinc-950">
                Check suspicious links
              </label>
              <input
                id="link-check"
                type="url"
                value={linkValue}
                onChange={(event) => setLinkValue(event.target.value)}
                placeholder="https://example.com"
                className="mt-3 min-h-14 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-lg text-zinc-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => void submitCheck("url")}
                disabled={isLoading}
                className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                Check Link
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-base leading-7 text-zinc-700">
          <p className="font-semibold text-zinc-950">Privacy reminder</p>
          <p>
            Do not submit your SSN, full card number, complete password, verification code, or sensitive personal
            information.
          </p>
          <p className="mt-2">
            {isPro ? "Pro mode is enabled in this browser." : `${remainingChecks} free checks left today.`}
          </p>
        </div>
      </section>

      <section className="space-y-5">
        {error ? <div className="break-words rounded-lg border border-red-200 bg-red-50 p-4 text-lg text-red-900">{error}</div> : null}
        {notice ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-lg text-amber-950">{notice}</div>
        ) : null}
        {paywallVisible ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <ShieldAlert aria-hidden="true" className="h-10 w-10 text-amber-600" />
            <h2 className="mt-4 text-2xl font-bold text-zinc-950">You&apos;ve used your 3 free checks today.</h2>
            <p className="mt-3 text-lg leading-8 text-zinc-700">Upgrade for more scam checks.</p>
            <button
              type="button"
              onClick={() => void handleUpgrade()}
              className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-zinc-950 px-6 py-4 text-lg font-semibold text-white hover:bg-zinc-800"
            >
              Upgrade to Pro - $9/month
            </button>
          </div>
        ) : null}
        {isLoading ? <LoadingState /> : null}
        {result ? <ResultCard result={result} /> : null}
      </section>
    </div>
  );
}
