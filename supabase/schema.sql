create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'free',
  paddle_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  paddle_customer_id text,
  paddle_subscription_id text unique not null,
  paddle_price_id text,
  paddle_product_id text,
  status text not null,
  plan text not null default 'pro',
  current_billing_period_starts_at timestamptz,
  current_billing_period_ends_at timestamptz,
  scheduled_change jsonb,
  cancel_at_period_end boolean default false,
  collection_mode text,
  currency_code text,
  test_mode boolean default false,
  last_event_id text,
  last_event_occurred_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  anonymous_id text,
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
  provider_used text,
  created_at timestamptz default now()
);

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  anonymous_id text,
  ip_hash text,
  event_type text not null,
  created_at timestamptz default now()
);

drop index if exists profiles_stripe_customer_id_idx;
drop index if exists subscriptions_stripe_customer_id_idx;
drop index if exists subscriptions_stripe_subscription_id_idx;
drop index if exists profiles_lemonsqueezy_customer_id_idx;
drop index if exists subscriptions_lemonsqueezy_customer_id_idx;
drop index if exists subscriptions_lemonsqueezy_subscription_id_idx;
drop index if exists subscriptions_lemonsqueezy_variant_id_idx;

alter table profiles add column if not exists paddle_customer_id text;
alter table profiles add column if not exists plan text not null default 'free';
alter table profiles drop column if exists stripe_customer_id;
alter table profiles drop column if exists lemonsqueezy_customer_id;

alter table subscriptions add column if not exists user_id uuid references profiles(id) on delete cascade;
alter table subscriptions add column if not exists paddle_customer_id text;
alter table subscriptions add column if not exists paddle_subscription_id text;
alter table subscriptions add column if not exists paddle_price_id text;
alter table subscriptions add column if not exists paddle_product_id text;
alter table subscriptions add column if not exists status text;
alter table subscriptions add column if not exists plan text not null default 'pro';
alter table subscriptions add column if not exists current_billing_period_starts_at timestamptz;
alter table subscriptions add column if not exists current_billing_period_ends_at timestamptz;
alter table subscriptions add column if not exists scheduled_change jsonb;
alter table subscriptions add column if not exists cancel_at_period_end boolean default false;
alter table subscriptions add column if not exists collection_mode text;
alter table subscriptions add column if not exists currency_code text;
alter table subscriptions add column if not exists test_mode boolean default false;
alter table subscriptions add column if not exists last_event_id text;
alter table subscriptions add column if not exists last_event_occurred_at timestamptz;
alter table subscriptions add column if not exists created_at timestamptz default now();
alter table subscriptions add column if not exists updated_at timestamptz default now();

update subscriptions
set
  paddle_subscription_id = coalesce(paddle_subscription_id, 'legacy-' || id::text),
  status = coalesce(status, 'expired')
where paddle_subscription_id is null or status is null;

alter table subscriptions alter column paddle_subscription_id set not null;
alter table subscriptions alter column status set not null;

alter table subscriptions drop column if exists stripe_customer_id;
alter table subscriptions drop column if exists stripe_subscription_id;
alter table subscriptions drop column if exists stripe_price_id;
alter table subscriptions drop column if exists current_period_start;
alter table subscriptions drop column if exists current_period_end;
alter table subscriptions drop column if exists email;
alter table subscriptions drop column if exists lemonsqueezy_customer_id;
alter table subscriptions drop column if exists lemonsqueezy_subscription_id;
alter table subscriptions drop column if exists lemonsqueezy_order_id;
alter table subscriptions drop column if exists lemonsqueezy_product_id;
alter table subscriptions drop column if exists lemonsqueezy_variant_id;
alter table subscriptions drop column if exists status_formatted;
alter table subscriptions drop column if exists renews_at;
alter table subscriptions drop column if exists ends_at;
alter table subscriptions drop column if exists trial_ends_at;
alter table subscriptions drop column if exists cancelled;
alter table subscriptions drop column if exists customer_portal_url;
alter table subscriptions drop column if exists update_payment_method_url;

alter table checks add column if not exists user_id uuid references profiles(id) on delete set null;
alter table checks add column if not exists anonymous_id text;
alter table checks add column if not exists provider_used text;

alter table usage_events add column if not exists user_id uuid references profiles(id) on delete cascade;

create unique index if not exists profiles_paddle_customer_id_idx
  on profiles (paddle_customer_id)
  where paddle_customer_id is not null;

create index if not exists subscriptions_user_id_idx
  on subscriptions (user_id);

create index if not exists subscriptions_paddle_customer_id_idx
  on subscriptions (paddle_customer_id);

create unique index if not exists subscriptions_paddle_subscription_id_idx
  on subscriptions (paddle_subscription_id);

create index if not exists subscriptions_paddle_price_id_idx
  on subscriptions (paddle_price_id);

create index if not exists checks_user_id_idx
  on checks (user_id);

create index if not exists checks_anonymous_id_idx
  on checks (anonymous_id);

create index if not exists checks_created_at_idx
  on checks (created_at desc);

create index if not exists usage_events_user_id_idx
  on usage_events (user_id);

create index if not exists usage_events_anonymous_id_idx
  on usage_events (anonymous_id);

create index if not exists usage_events_created_at_idx
  on usage_events (created_at desc);

create index if not exists usage_events_anonymous_created_at_idx
  on usage_events (anonymous_id, created_at desc);

create index if not exists usage_events_ip_created_at_idx
  on usage_events (ip_hash, created_at desc);

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table checks enable row level security;
alter table usage_events enable row level security;

drop policy if exists "Users can read own profile" on profiles;
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Service role can manage profiles" on profiles;
create policy "Service role can manage profiles"
  on profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Users can read own subscriptions" on subscriptions;
create policy "Users can read own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage subscriptions" on subscriptions;
create policy "Service role can manage subscriptions"
  on subscriptions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Users can read own checks" on checks;
create policy "Users can read own checks"
  on checks for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage checks" on checks;
create policy "Service role can manage checks"
  on checks for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage usage events" on usage_events;
create policy "Service role can manage usage events"
  on usage_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on subscriptions;
create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.protect_profile_billing_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    new.plan = old.plan;
    new.paddle_customer_id = old.paddle_customer_id;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_billing_fields on profiles;
create trigger profiles_protect_billing_fields
  before update on profiles
  for each row execute function public.protect_profile_billing_fields();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
