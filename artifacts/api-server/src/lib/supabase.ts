import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env["SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_KEY"];
  if (!url || !serviceKey) {
    logger.warn(
      "Supabase env vars missing (SUPABASE_URL, SUPABASE_SERVICE_KEY). Leaderboard persistence disabled.",
    );
    return null;
  }
  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export type LeaderboardRow = {
  user_id: string;
  display_name: string;
  trust_balance: number;
  days_completed: number;
  last_updated: string;
};
