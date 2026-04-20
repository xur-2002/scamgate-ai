import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  anonymousId: z.string().max(128).optional(),
});

export async function POST(request: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!secretKey || !priceId) {
      return NextResponse.json({
        configured: false,
        message: "Payments are not configured in this local demo.",
      });
    }

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = checkoutSchema.safeParse(body);
    const anonymousId = parsed.success ? parsed.data.anonymousId : undefined;
    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/check?upgraded=1`,
      cancel_url: `${appUrl}/check?canceled=1`,
      metadata: {
        anonymousId: anonymousId ?? "",
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      configured: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error.", error);
    return NextResponse.json(
      {
        message: "Could not start checkout. Please try again.",
      },
      { status: 500 },
    );
  }
}
