-- AUM — Audio briefing tracking
-- Adds two array columns to the existing public.leaderboard table so we
-- can record which day-briefing recordings + character intros each player
-- has listened to in full.
--
-- Run this ONCE in your Supabase project's SQL editor AFTER
-- supabase-leaderboard.sql (which creates the table itself).
--   Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- The script is idempotent (`add column if not exists`).

alter table public.leaderboard
  add column if not exists audio_listened int[] not null default '{}'::int[];

alter table public.leaderboard
  add column if not exists intros_listened text[] not null default '{}'::text[];

-- Optional: index for analytics queries (e.g. "how many players finished
-- the day-1 audio?"). GIN index supports `where audio_listened @> array[1]`.
create index if not exists leaderboard_audio_listened_gin
  on public.leaderboard using gin (audio_listened);

create index if not exists leaderboard_intros_listened_gin
  on public.leaderboard using gin (intros_listened);
