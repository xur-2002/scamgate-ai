import { LoginForm } from "@/components/LoginForm";
import { Header } from "@/components/Header";
import { sanitizeNextPath } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next, "/account");

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-xl px-5 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-800">Login</p>
        <h1 className="mt-3 text-4xl font-bold tracking-normal text-zinc-950">Sign in to manage Pro.</h1>
        <p className="mt-4 text-lg leading-8 text-zinc-700">
          Enter your email and ScamGate will send a secure magic link.
        </p>
        {params.error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-900">{params.error}</p>
        ) : null}
        <div className="mt-8">
          <LoginForm nextPath={nextPath} />
        </div>
      </main>
    </div>
  );
}
