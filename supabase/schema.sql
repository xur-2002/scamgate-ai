create extension if not exists pgcrypto;

create table if not exists checks (
  id uuid primary key default gen_random_uuid(),
  input_type text not null,
  raw_text text,
  extracted_urls text[],
  risk_score integer not null,
  risk_level text not null,
  scam_type text,
  red_flags jsonb,
  plain_english_explanation text,
  recommended_action text,
  safe_next_step text,
  confidence text,
  created_at timestamptz default now()
);

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text,
  ip_hash text,
  event_type text not null,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free',
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists usage_events_anonymous_created_at_idx
  on usage_events (anonymous_id, created_at desc);

create index if not exists usage_events_ip_created_at_idx
  on usage_events (ip_hash, created_at desc);

create index if not exists checks_created_at_idx
  on checks (created_at desc);
