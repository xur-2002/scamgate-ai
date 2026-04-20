import { NextResponse } from "next/server";
import Stripe from "stripe";

import { saveSubscriptionFromCheckoutSession } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey || !webhookSecret) {
      return NextResponse.json({
        received: true,
        configured: false,
        message: "Stripe webhook is not configured in this local demo.",
      });
    }

    const stripe = new Stripe(secretKey);
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
    }

    const payload = await request.text();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await saveSubscriptionFromCheckoutSession(session);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error.", error);
    return NextResponse.json({ message: "Webhook handling failed." }, { status: 400 });
  }
}
