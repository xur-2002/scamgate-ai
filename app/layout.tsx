import type { Metadata } from "next";

import { Footer } from "@/components/Footer";

import "./globals.css";

export const metadata: Metadata = {
  title: "ScamGate AI",
  description: "Check suspicious messages, links, and emails before you click.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 text-zinc-950">
        {children}
        <Footer />
      </body>
    </html>
  );
}
