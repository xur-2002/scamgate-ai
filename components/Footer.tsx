import Link from "next/link";

const links = [
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refund Policy" },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-6 text-base text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>ScamGate AI provides educational scam-risk signals only.</p>
        <nav aria-label="Policy links" className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="font-semibold text-zinc-700 hover:text-zinc-950">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
