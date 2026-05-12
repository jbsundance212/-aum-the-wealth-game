-- AUM — Mandate unlock column for the Stripe paywall.
--
-- Adds `mandate_unlocked boolean` to the existing `leaderboard` table so the
-- Stripe webhook (and the success-URL round-trip) can flip a player's row to
-- TRUE after they purchase the $9.99 "Mandate Unlock" one-time product.
--
-- Run once in the Supabase SQL editor:
--   project → SQL Editor → New query → paste this file → Run.
--
-- Idempotent: safe to re-run. Uses `add column if not exists`.

alter table public.leaderboard
  add column if not exists mandate_unlocked boolean not null default false;

-- Partial index on the rare TRUE values lets us cheaply count paying players
-- without scanning the whole table. Cost is ~zero until many users unlock.
create index if not exists leaderboard_mandate_unlocked_true_idx
  on public.leaderboard (mandate_unlocked)
  where mandate_unlocked = true;

-- Sanity-print: show how many rows now carry the column.
select
  count(*) as total_players,
  count(*) filter (where mandate_unlocked) as unlocked_players
from public.leaderboard;
