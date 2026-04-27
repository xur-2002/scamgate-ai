import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isGroqConfigured() {
  return Boolean(
    process.env.AI_PROVIDER === "groq" &&
      process.env.GROQ_API_KEY &&
      process.env.GROQ_MODEL &&
      process.env.GROQ_BASE_URL,
  );
}

function isPaddleConfigured() {
  return Boolean(
    process.env.PADDLE_API_KEY &&
      process.env.PADDLE_WEBHOOK_SECRET &&
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
      process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID,
  );
}

export function GET() {
  return NextResponse.json({
    ok: true,
    env: process.env.NODE_ENV === "production" ? "production" : "development",
    supabaseConfigured: isSupabaseConfigured(),
    groqConfigured: isGroqConfigured(),
    paddleConfigured: isPaddleConfigured(),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    timestamp: new Date().toISOString(),
  });
}
