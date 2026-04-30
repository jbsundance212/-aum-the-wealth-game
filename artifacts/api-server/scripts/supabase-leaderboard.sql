-- AUM — Leaderboard table
-- Run this ONCE in your Supabase project's SQL editor
-- (https://app.supabase.com → your project → SQL Editor → "New query" → paste → Run)

create table if not exists public.leaderboard (
  user_id uuid primary key,
  display_name text not null,
  trust_balance integer not null default 0,
  days_completed integer not null default 0,
  last_updated timestamptz not null default now()
);

create index if not exists leaderboard_trust_balance_idx
  on public.leaderboard (trust_balance desc);

-- Row Level Security: lock down direct client access.
-- All reads/writes go through the api-server using the service-role key,
-- which bypasses RLS automatically.
alter table public.leaderboard enable row level security;

-- Explicit deny policies (defense in depth). With RLS enabled and no
-- permissive policies, anon/authenticated roles already get zero access,
-- but stating this explicitly makes the intent unambiguous and survives
-- future schema migrations.
drop policy if exists "deny anon read"   on public.leaderboard;
drop policy if exists "deny anon write"  on public.leaderboard;
drop policy if exists "deny auth read"   on public.leaderboard;
drop policy if exists "deny auth write"  on public.leaderboard;

create policy "deny anon read"
  on public.leaderboard for select
  to anon using (false);

create policy "deny anon write"
  on public.leaderboard for all
  to anon using (false) with check (false);

create policy "deny auth read"
  on public.leaderboard for select
  to authenticated using (false);

create policy "deny auth write"
  on public.leaderboard for all
  to authenticated using (false) with check (false);

-- The service_role key bypasses RLS by design, so the api-server can
-- still read and upsert. Keep SUPABASE_SERVICE_KEY server-side only.
