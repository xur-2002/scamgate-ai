import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getLatestSubscriptionForUser, getProfileByUserId } from "@/lib/db";
import { createPaddleCustomerPortalSession, PaddleConfigError } from "@/lib/paddle/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Please log in before managing billing." }, { status: 401 });
    }

    const profile = await getProfileByUserId(user.id);

    if (!profile?.paddle_customer_id) {
      return NextResponse.json({ message: "No billing account found." }, { status: 400 });
    }

    const subscription = await getLatestSubscriptionForUser(user.id);
    const url = await createPaddleCustomerPortalSession({
      customerId: profile.paddle_customer_id,
      subscriptionId: subscription?.paddle_subscription_id,
    });

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof PaddleConfigError) {
      return NextResponse.json(
        {
          message: "Paddle Customer Portal is not configured in this environment.",
        },
        { status: 503 },
      );
    }

    console.error("Paddle portal error.", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "Could not open billing portal. Please try again." }, { status: 500 });
  }
}
