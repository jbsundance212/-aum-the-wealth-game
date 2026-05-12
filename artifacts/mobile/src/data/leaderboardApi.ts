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

export type AudioListenedPayload =
  | { user_id: string; kind: "day"; day_number: number }
  | { user_id: string; kind: "intro"; intro_key: "barnaby" | "sterling" | "crane" };

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

export function recordAudioListened(
  payload: AudioListenedPayload,
): Promise<void> {
  return postJson("/leaderboard/audio", payload);
}

// Stripe paywall ---------------------------------------------------------
// Server creates a Checkout Session and returns its hosted-checkout URL.
// On error returns null and logs (caller stays on the paywall).
export async function createCheckoutSession(payload: {
  user_id: string;
  display_name: string;
  return_origin: string;
}): Promise<{ url: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/stripe/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn(`[stripe] checkout → ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { url?: string };
    if (!data.url) return null;
    return { url: data.url };
  } catch (err) {
    console.warn("[stripe] checkout failed", err);
    return null;
  }
}

// Lightweight server check — used by the mobile store to refresh the
// local mandate_unlocked flag if a payment landed in another tab/device.
export async function fetchMandateStatus(
  userId: string,
): Promise<boolean | null> {
  try {
    const res = await fetch(
      `${API_BASE}/stripe/status?user_id=${encodeURIComponent(userId)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { mandate_unlocked?: boolean };
    return Boolean(data.mandate_unlocked);
  } catch (err) {
    console.warn("[stripe] status failed", err);
    return null;
  }
}

// Server-trusted verification of a completed Stripe Checkout Session.
// The success-URL screen calls this to confirm the payment AND trigger
// the server-side Supabase unlock (the GET endpoint is the primary
// unlock path; the webhook is a backup).
export type StripeSessionInfo = {
  paid: boolean;
  user_id: string | null;
  display_name: string;
  amount_total: number;
  currency: string;
  reference: string;
  error: "user_mismatch" | "product_mismatch" | "not_paid" | null;
};

// `userId` binds the verification to the current player — the server
// returns `paid: false, error: "user_mismatch"` if a leaked session_id
// from another account is presented.
export async function fetchStripeSession(
  sessionId: string,
  userId: string,
): Promise<StripeSessionInfo | null> {
  try {
    const url =
      `${API_BASE}/stripe/session` +
      `?session_id=${encodeURIComponent(sessionId)}` +
      `&user_id=${encodeURIComponent(userId)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as StripeSessionInfo;
  } catch (err) {
    console.warn("[stripe] session fetch failed", err);
    return null;
  }
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
