import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-xl font-bold text-zinc-950">{title}</h3>
      <p className="mt-3 text-base leading-7 text-zinc-700">{description}</p>
    </article>
  );
}
