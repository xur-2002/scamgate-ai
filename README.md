# ScamGate AI

ScamGate AI is a fast Web MVP for checking suspicious texts, emails, chats, and links before a user clicks, pays, or shares private information.

It returns a plain-English scam-risk rating with a score, scam type, red flags, recommended action, and safe next step. The product is designed for everyday internet users and families in the United States.

## MVP Scope

Included:

- Landing page at `/`
- Scam checker at `/check`
- Text and link checking
- Groq-powered AI analysis with a local rules fallback
- Supabase Auth login with email magic links
- Paddle Billing checkout for ScamGate Pro
- Paddle webhook sync to Supabase subscription state
- Paddle Customer Portal for billing management
- Free limit of 3 checks per day
- Pro limit of 100 checks per day during beta
- Pricing, Privacy, Terms, Login, and Account pages

Not included:

- No public screenshot checker UI until image AI is configured
- No SMS forwarding detection
- No Twilio integration
- No mobile app
- No browser extension
- No automatic family contact alerts
- No complex dashboard
- No custom credit card forms or card storage

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- Supabase Auth and PostgreSQL
- Paddle Billing, Paddle.js, Customer Portal, and webhooks
- Groq API
- OpenAI API fallback for future screenshot analysis
- Vercel-ready API routes

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

The app runs without real OpenAI, Supabase, or Paddle keys. Missing services return readable demo-mode messages instead of crashing.

## Environment Variables

Local development should keep:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=

AI_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

SCAMGATE_FORCE_PRO=false
```

`PADDLE_API_KEY` and `PADDLE_WEBHOOK_SECRET` are server-side secrets. `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` and `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID` are safe for frontend Paddle.js use. Never commit `.env.local`.

For production on Vercel, set:

```bash
NEXT_PUBLIC_APP_URL=https://scamgate-ai.vercel.app
```

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Enable email magic link auth in Supabase Auth settings.
5. Open Authentication -> URL Configuration.
6. Set Site URL:

```text
https://scamgate-ai.vercel.app
```

7. Add Redirect URLs:

```text
http://localhost:3000/auth/callback
https://scamgate-ai.vercel.app/auth/callback
```

Tables created:

- `profiles`
- `subscriptions`
- `checks`
- `usage_events`

The schema includes RLS policies, profile creation on new Supabase users, `updated_at` triggers, and protected billing fields.

## Paddle Setup

1. Create a Paddle Billing account.
2. Use Sandbox first.
3. Create a Product named `ScamGate Pro`.
4. Create a monthly recurring Price for `$9/month`.
5. Copy the Price ID, usually `pri_...`, into:

```bash
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=
```

6. Create a client-side token and set:

```bash
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
```

7. Create an API key and set:

```bash
PADDLE_API_KEY=
```

8. Create a Notification Destination webhook and copy its secret key:

```bash
PADDLE_WEBHOOK_SECRET=
```

Local webhook testing needs a public URL because Paddle cannot call `localhost` directly. Use ngrok or Cloudflare Tunnel:

```bash
ngrok http 3000
```

Set the Paddle webhook URL to:

```text
https://your-tunnel-url/api/paddle/webhook
```

For production:

```text
https://scamgate-ai.vercel.app/api/paddle/webhook
```

`PADDLE_WEBHOOK_SECRET` must exactly match the Notification Destination secret key in Paddle.

Webhook events:

- `subscription.created`
- `subscription.activated`
- `subscription.updated`
- `subscription.canceled`
- `subscription.paused`
- `subscription.resumed`
- `subscription.past_due`
- `subscription.trialing`
- `transaction.completed`
- `transaction.paid`

## Subscription Flow

1. User logs in with Supabase magic link.
2. User clicks `Upgrade to Pro`.
3. Frontend initializes Paddle.js with the client-side token.
4. Paddle Checkout opens with the Pro price ID, user email, and `customData.user_id`.
5. User completes payment in Paddle Checkout.
6. Paddle sends a signed webhook to `/api/paddle/webhook`.
7. Webhook verifies `Paddle-Signature`, upserts `subscriptions`, and updates `profiles.plan`.
8. Pro users get higher `/api/analyze` usage limits.
9. Account page opens a temporary Paddle Customer Portal session.
10. Paused, past due, inactive, expired, or ended subscriptions downgrade to free. Canceled subscriptions remain Pro until the current billing period ends.

## AI Configuration

Set these in `.env.local` for real Text and Link checks:

```bash
AI_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

Screenshot analysis is currently hidden in the public UI. Server-side fallback remains for future image AI configuration.

## Local Testing

Run:

```bash
npm run dev
```

Test free checks at:

```text
http://localhost:3000/check
```

Test checkout:

1. Configure Supabase env vars and run `supabase/schema.sql`.
2. Configure Paddle sandbox env vars.
3. Log in at `/login`.
4. Click `Upgrade to Pro`.
5. Confirm Paddle Checkout opens and includes `customData.user_id`.
6. Complete a Paddle sandbox checkout.
7. Return to `/account` and confirm plan changes after the webhook runs.
8. Open `Manage Billing` to test the Paddle Customer Portal session.

Test webhook locally:

1. Start the app with `npm run dev`.
2. Start ngrok or Cloudflare Tunnel to expose port `3000`.
3. Set the public `/api/paddle/webhook` URL in Paddle.
4. Use the same webhook secret in Paddle and `.env.local`.
5. Complete a sandbox checkout or simulate a webhook and confirm `profiles.plan` changes to `pro`.

Free users should receive a 429/paywall after 3 checks per day. Pro users should not hit the 3-check limit.

## Build

```bash
npm run lint
npm run build
```

## Vercel Deployment

```bash
npm run build
vercel
```

Add these environment variables in Vercel Project Settings:

- `NEXT_PUBLIC_APP_URL=https://scamgate-ai.vercel.app`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- `NEXT_PUBLIC_PADDLE_ENVIRONMENT`
- `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID`
- `AI_PROVIDER`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Open Vercel -> Project -> Settings -> Environment Variables to add these. Redeploy after saving them; old Vercel deployments do not automatically pick up newly added environment variables.

## Production Smoke Test

1. Open:

```text
https://scamgate-ai.vercel.app
```

2. Test AI at:

```text
https://scamgate-ai.vercel.app/check
```

Use:

```text
Your USPS package is delayed. Pay $0.30 now at usps-redelivery-help.com or your package will be returned.
```

Expected: High Risk.

3. Test deployment health:

```text
https://scamgate-ai.vercel.app/api/health
```

Expected:

```json
{
  "supabaseConfigured": true,
  "groqConfigured": true,
  "paddleConfigured": true
}
```

4. Test login:

```text
https://scamgate-ai.vercel.app/login
```

The magic link should return to:

```text
https://scamgate-ai.vercel.app/auth/callback
```

5. Test account:

```text
https://scamgate-ai.vercel.app/account
```

Expected: user email and current plan.

6. Test Paddle:

```text
https://scamgate-ai.vercel.app/pricing
```

After login, `Upgrade to Pro` should open Paddle Sandbox Checkout.

7. After a Paddle Sandbox payment, confirm in Supabase:

- `profiles.plan` changes to `pro`
- `subscriptions` has a `paddle_subscription_id`

8. Test Pro access: the same Pro user should not see the free-user paywall on the 4th check.

## Safety Notes

ScamGate provides educational risk signals only. It does not guarantee fraud detection, does not recover lost funds, and does not provide legal, financial, or investment advice.

Do not submit:

- Full Social Security numbers
- Full bank card numbers
- Complete passwords
- Verification codes or OTPs
- Sensitive personal information

For high-risk results, verify through official websites or phone numbers typed manually, and ask a trusted family member before responding.

Payment safety:

- Do not put `PADDLE_API_KEY` in frontend code.
- Do not commit `.env.local`.
- Do not save card numbers.
- Use Paddle Checkout and Paddle Customer Portal only.
- Grant Pro access from verified webhook state, not from the frontend success page alone.

## Test Inputs

Sample 1:

```text
Your USPS package is delayed. Pay $0.30 now at usps-redelivery-help.com or your package will be returned.
```

Expected: High risk / delivery or phishing.

Sample 2:

```text
Hi grandma, I lost my phone. Please send me $500 by Zelle and don't tell mom.
```

Expected: High risk / family emergency scam language.

Sample 3:

```text
Your Microsoft computer has been infected. Call this number now and install AnyDesk.
```

Expected: High risk / tech support scam.

Sample 4:

```text
Can you verify the item is still available on Facebook Marketplace?
```

Expected: Low or medium depending on context.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```
