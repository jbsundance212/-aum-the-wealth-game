// Thin client for the api-server leaderboard endpoints.
// All calls are fire-and-forget from the caller's perspective: errors are
// logged but never thrown, so a backend hiccup never breaks the gameplay.

const DOMAIN = process.env["EXPO_PUBLIC_DOMAIN"] ?? "";
const API_BASE = DOMAIN ? `https://${DOMAIN}/api` : "/api";

export type LeaderboardPlayer = {
  user_id: string;
  display_name: string;
  trust_balance: number;
  days_completed: number;
  last_updated: string;
};

export type SyncPayload = {
  user_id: string;
  display_name: string;
  trust_balance: number;
  days_completed: number;
};

export type BourseResultPayload = SyncPayload & {
  day_number: number;
  pnl: number;
};

async function postJson(path: string, body: unknown): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[leaderboard] ${path} → ${res.status} ${text}`);
    }
  } catch (err) {
    console.warn(`[leaderboard] ${path} failed`, err);
  }
}

export function syncLeaderboard(payload: SyncPayload): Promise<void> {
  return postJson("/leaderboard/sync", payload);
}

export function postBourseResult(payload: BourseResultPayload): Promise<void> {
  return postJson("/leaderboard/bourse-result", payload);
}

export async function fetchLeaderboard(): Promise<LeaderboardPlayer[]> {
  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    if (!res.ok) return [];
    const data = (await res.json()) as { players?: LeaderboardPlayer[] };
    return data.players ?? [];
  } catch (err) {
    console.warn("[leaderboard] fetch failed", err);
    return [];
  }
}
