import { LoaderCircle } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border border-zinc-200 bg-white p-6 text-zinc-700">
      <div className="flex items-center gap-3 text-lg font-semibold">
        <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin text-emerald-700" />
        Checking for scam signals...
      </div>
    </div>
  );
}
