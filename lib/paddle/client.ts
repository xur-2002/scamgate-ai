"use client";

import { initializePaddle, type CheckoutEventNames, type Environments, type Paddle } from "@paddle/paddle-js";

type PaddleEnvironment = Extract<Environments, "sandbox" | "production">;

type OpenCheckoutInput = {
  userId: string;
  email: string;
  nextPath?: string;
};

let paddlePromise: Promise<Paddle | undefined> | null = null;

function getPaddleEnvironment(): PaddleEnvironment {
  return process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";
}

function getPaddleConfig() {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID;

  if (!token || !priceId) {
    throw new Error("Paddle Checkout is not configured in this environment.");
  }

  return {
    token,
    priceId,
    environment: getPaddleEnvironment(),
  };
}

function getPublicAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
}

async function getPaddle(eventCallback: (eventName?: CheckoutEventNames) => void): Promise<Paddle> {
  const config = getPaddleConfig();

  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      token: config.token,
      environment: config.environment,
      eventCallback(event) {
        eventCallback(event.name);
      },
    });
  }

  const paddle = await paddlePromise;

  if (!paddle) {
    throw new Error("Paddle Checkout could not be loaded.");
  }

  if (paddle.Initialized) {
    paddle.Update({
      eventCallback(event) {
        eventCallback(event.name);
      },
    });
  }

  return paddle;
}

export async function openPaddleCheckout({ userId, email, nextPath = "/account" }: OpenCheckoutInput) {
  const config = getPaddleConfig();
  const successUrl = `${getPublicAppUrl()}${nextPath}?checkout=success`;
  const paddle = await getPaddle((eventName) => {
    if (eventName === "checkout.completed") {
      window.location.assign(successUrl);
    }
  });

  paddle.Checkout.open({
    items: [
      {
        priceId: config.priceId,
        quantity: 1,
      },
    ],
    customer: {
      email,
    },
    customData: {
      user_id: userId,
      plan: "pro",
    },
    settings: {
      displayMode: "overlay",
      theme: "light",
      locale: "en",
      successUrl,
    },
  });
}
