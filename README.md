# ScamGate AI

ScamGate AI is a fast Web MVP for checking suspicious messages, links, emails, and chats before a user clicks, pays, or shares private information.

It returns a plain-English scam-risk rating with a score, scam type, red flags, recommended action, and safe next step. The product is designed for everyday internet users and families in the United States.

## MVP Scope

Included:

- Landing page at `/`
- Scam checker at `/check`
- Text and link tabs
- Local rule engine before AI analysis
- Groq text/link analysis with OpenAI screenshot fallback kept server-side for future use
- Supabase-ready persistence for checks and usage events
- Stripe Checkout and webhook routes
- Free limit of 3 checks per day using localStorage plus backend usage tracking
- Pricing, Privacy, and Terms pages

Not included in this MVP:

- No public screenshot checker UI until image AI is configured
- No SMS forwarding detection
- No Twilio integration
- No mobile app
- No browser extension
- No automatic family contact alerts
- No dashboard beyond the MVP checker flow

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- Supabase
- Stripe
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

The app runs without real OpenAI, Supabase, or Stripe keys. Missing services fall back to demo mode instead of crashing.

## Environment Variables

```bash
AI_PROVIDER=groq

GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000

SCAMGATE_FORCE_PRO=false
```

`SCAMGATE_FORCE_PRO=true` is an optional local override to bypass the 3-check daily limit while testing.

## AI Configuration

Set `AI_PROVIDER=groq` and `GROQ_API_KEY` in `.env.local` for real Text and Link checks.

`OPENAI_MODEL` defaults to `gpt-4.1-mini`. The public MVP currently hides screenshot analysis while the image AI configuration is incomplete.

In demo mode, screenshot analysis is not shown in the UI.

## Supabase Configuration

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Add the Supabase values to `.env.local`.

Tables:

- `checks`
- `usage_events`
- `subscriptions`

If Supabase is not configured, checks are not saved and the server logs a demo-mode warning.

## Stripe Configuration

1. Create a Stripe recurring price for the Pro plan.
2. Set `STRIPE_SECRET_KEY`.
3. Set `NEXT_PUBLIC_STRIPE_PRICE_ID`.
4. Set `NEXT_PUBLIC_APP_URL`.
5. Configure a webhook pointing to `/api/stripe/webhook`.
6. Set `STRIPE_WEBHOOK_SECRET`.

Checkout mode is `subscription`, with:

- Success URL: `/check?upgraded=1`
- Cancel URL: `/check?canceled=1`

If Stripe is not configured, the upgrade button shows: `Payments are not configured in this local demo.`

## Vercel Deployment

```bash
npm run build
vercel
```

Then add the same environment variables in Vercel Project Settings.

## Safety Notes

ScamGate provides educational risk signals only. It does not guarantee fraud detection, does not recover lost funds, and does not provide legal, financial, or investment advice.

Do not submit:

- Full Social Security numbers
- Full bank card numbers
- Complete passwords
- Verification codes or OTPs
- Sensitive personal information

For high-risk results, verify through official websites or phone numbers typed manually, and ask a trusted family member before responding.

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

Expected: High risk / family emergency scam language. The API enum may return `unknown` while the explanation highlights the family-emergency pattern.

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
