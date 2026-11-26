-- Petty — 0001 init. Optional accounts: email + billing state + E2EE blobs only.
-- RLS everywhere. The service role (Stripe webhook / cron) is the ONLY writer of plan fields.
-- Pantry/Clockwatch bodies are AES-256-GCM ciphertext envelopes — server stores opaque bytes.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'free' check (plan in ('free', 'household')),
  household_id uuid,
  stripe_customer_id text unique,
  sync_salt text not null,              -- hex(16 random bytes) — KDF salt for the vault key (NOT secret)
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles: read own" on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own non-plan fields" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id and plan = (select plan from public.profiles where id = auth.uid()));
-- plan/stripe_customer_id change ONLY via service role (bypasses RLS).

create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.households enable row level security;
create policy "households: owner read" on public.households for select using (auth.uid() = owner);
create policy "households: owner insert" on public.households for insert with check (auth.uid() = owner);

create table public.household_seats (
  household_id uuid not null references public.households(id) on delete cascade,
  member_email text not null,           -- invited address (lowercased)
  claimed_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  primary key (household_id, member_email)
);
alter table public.household_seats enable row level security;
create policy "seats: owner manages" on public.household_seats for all using (
  exists (select 1 from public.households h where h.id = household_id and h.owner = auth.uid()));
create policy "seats: invitee sees own invitation" on public.household_seats for select using (
  lower(member_email) = lower((select email from public.profiles where id = auth.uid())));
-- Hard cap: 6 seats per household.
create or replace function public.enforce_seat_cap() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.household_seats where household_id = new.household_id) >= 6 then
    raise exception 'household seat cap reached (6)';
  end if;
  return new;
end $$;
create trigger household_seat_cap before insert on public.household_seats
  for each row execute function public.enforce_seat_cap();

-- E2EE payloads. Server stores ciphertext envelopes ONLY + minimal plaintext routing metadata.
create table public.clockwatch_entries (
  id text primary key,                  -- client-generated id (same as local)
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id text not null default 'default',
  due_date date not null,               -- PLAINTEXT metadata — powers the cron digest; disclosed in Terms
  body text not null,                   -- JSON envelope {"v":1,"iv":"<b64>","ct":"<b64>"} (AES-256-GCM)
  updated_at timestamptz not null default now()
);
alter table public.clockwatch_entries enable row level security;
create policy "clockwatch: owner rw" on public.clockwatch_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index clockwatch_due_idx on public.clockwatch_entries (due_date) where due_date is not null;

create table public.pantry_items (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id text not null default 'default',
  expires_at date,                      -- PLAINTEXT metadata (same rationale / disclosure), nullable
  body text not null,                   -- ciphertext envelope
  updated_at timestamptz not null default now()
);
alter table public.pantry_items enable row level security;
create policy "pantry: owner rw" on public.pantry_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index pantry_expires_idx on public.pantry_items (expires_at);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null,                 -- active | past_due | canceled | trialing …
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "subscriptions: owner read" on public.subscriptions for select using (auth.uid() = user_id);
-- Writes: service role only (Stripe webhook). No user-facing insert/update policy = no writes via anon key.

-- Claim a household seat on sign-in: if your email was invited, you inherit household plan on this account.
create or replace function public.claim_household_seat() returns void language plpgsql security definer set search_path = public as $$
begin
  update public.household_seats s
     set claimed_by = auth.uid()
   where lower(s.member_email) = lower((select email from public.profiles where id = auth.uid()))
     and s.claimed_by is null;
  update public.profiles p
     set household_id = s.household_id, plan = 'household'
    from public.household_seats s
   where s.claimed_by = auth.uid()
     and p.id = auth.uid()
     and p.household_id is null;
end $$;
grant execute on function public.claim_household_seat() to authenticated;
