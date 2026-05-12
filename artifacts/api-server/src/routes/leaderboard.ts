import { Router, type IRouter } from "express";
import { getSupabase, type LeaderboardRow } from "../lib/supabase";
import { postToBourseChannel } from "../lib/discord";

const router: IRouter = Router();

// Helpers ----------------------------------------------------------------------

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    )
  );
}

function fmtMoney(n: number): string {
  if (n < 0) return `−$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

// GET /api/leaderboard ---------------------------------------------------------
router.get("/leaderboard", async (req, res) => {
  const sb = getSupabase();
  if (!sb) {
    res.status(503).json({ error: "leaderboard_unavailable" });
    return;
  }

  const { data, error } = await sb
    .from("leaderboard")
    .select("user_id,display_name,trust_balance,days_completed,last_updated")
    .order("trust_balance", { ascending: false })
    .limit(200);

  if (error) {
    req.log.error({ err: error }, "Supabase leaderboard fetch failed");
    res.status(500).json({ error: "fetch_failed", detail: error.message });
    return;
  }
  res.json({ players: (data ?? []) as LeaderboardRow[] });
});

// POST /api/leaderboard/sync ---------------------------------------------------
router.post("/leaderboard/sync", async (req, res) => {
  const sb = getSupabase();
  if (!sb) {
    res.status(503).json({ error: "leaderboard_unavailable" });
    return;
  }

  const { user_id, display_name, trust_balance, days_completed } =
    (req.body ?? {}) as Partial<LeaderboardRow>;

  if (!isUuid(user_id)) {
    res.status(400).json({ error: "invalid_user_id" });
    return;
  }
  if (typeof display_name !== "string" || display_name.trim().length === 0) {
    res.status(400).json({ error: "invalid_display_name" });
    return;
  }
  if (typeof trust_balance !== "number" || !Number.isFinite(trust_balance)) {
    res.status(400).json({ error: "invalid_trust_balance" });
    return;
  }
  if (typeof days_completed !== "number" || !Number.isFinite(days_completed)) {
    res.status(400).json({ error: "invalid_days_completed" });
    return;
  }

  const row = {
    user_id,
    display_name: display_name.slice(0, 60).trim(),
    trust_balance: Math.round(trust_balance),
    days_completed: Math.max(0, Math.min(49, Math.round(days_completed))),
    last_updated: new Date().toISOString(),
  };

  const { error } = await sb.from("leaderboard").upsert(row, {
    onConflict: "user_id",
  });
  if (error) {
    req.log.error({ err: error }, "Supabase leaderboard upsert failed");
    res.status(500).json({ error: "sync_failed", detail: error.message });
    return;
  }
  res.json({ ok: true });
});

// POST /api/leaderboard/bourse-result ------------------------------------------
router.post("/leaderboard/bourse-result", async (req, res) => {
  const {
    user_id,
    display_name,
    day_number,
    pnl,
    trust_balance,
    days_completed,
  } = (req.body ?? {}) as {
    user_id?: unknown;
    display_name?: unknown;
    day_number?: unknown;
    pnl?: unknown;
    trust_balance?: unknown;
    days_completed?: unknown;
  };

  if (
    !isUuid(user_id) ||
    typeof display_name !== "string" ||
    typeof day_number !== "number" ||
    !Number.isFinite(day_number) ||
    typeof pnl !== "number" ||
    !Number.isFinite(pnl) ||
    typeof trust_balance !== "number" ||
    !Number.isFinite(trust_balance)
  ) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

  const safeName = display_name.slice(0, 60).trim() || "Unknown Trustee";
  const sign = pnl >= 0 ? "+" : "−";
  const pnlStr = `${sign}$${Math.abs(Math.round(pnl)).toLocaleString("en-US")}`;
  const balStr = fmtMoney(trust_balance);

  const message = [
    `**${safeName}** · Day ${Math.max(1, Math.min(49, Math.round(day_number)))}`,
    `P&L: \`${pnlStr}\`   ·   NAV: \`${balStr}\``,
  ].join("\n");

  // Fire both writes; don't block on either.
  const [discordOk, supabaseRes] = await Promise.allSettled([
    postToBourseChannel(message),
    (async () => {
      const sb = getSupabase();
      if (!sb) return { skipped: true };
      const dc =
        typeof days_completed === "number" && Number.isFinite(days_completed)
          ? Math.max(0, Math.min(49, Math.round(days_completed)))
          : 0;
      return sb.from("leaderboard").upsert(
        {
          user_id,
          display_name: safeName,
          trust_balance: Math.round(trust_balance),
          days_completed: dc,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    })(),
  ]);

  if (discordOk.status === "rejected") {
    req.log.error({ err: discordOk.reason }, "Bourse Discord post failed");
  }
  if (supabaseRes.status === "rejected") {
    req.log.error({ err: supabaseRes.reason }, "Bourse Supabase upsert failed");
  }

  res.json({ ok: true });
});

// POST /api/leaderboard/audio --------------------------------------------------
// Records that a player has finished listening to a briefing or intro audio.
// Idempotent: appends to the array only if the value is not already present.
router.post("/leaderboard/audio", async (req, res) => {
  const sb = getSupabase();
  if (!sb) {
    res.status(503).json({ error: "leaderboard_unavailable" });
    return;
  }

  const body = (req.body ?? {}) as {
    user_id?: unknown;
    kind?: unknown;
    day_number?: unknown;
    intro_key?: unknown;
  };

  if (!isUuid(body.user_id)) {
    res.status(400).json({ error: "invalid_user_id" });
    return;
  }
  const kind = body.kind;
  if (kind !== "day" && kind !== "intro") {
    res.status(400).json({ error: "invalid_kind" });
    return;
  }

  let dayNum: number | null = null;
  let introKey: string | null = null;
  if (kind === "day") {
    if (
      typeof body.day_number !== "number" ||
      !Number.isFinite(body.day_number) ||
      body.day_number < 1 ||
      body.day_number > 50
    ) {
      res.status(400).json({ error: "invalid_day_number" });
      return;
    }
    dayNum = Math.round(body.day_number);
  } else {
    if (
      body.intro_key !== "barnaby" &&
      body.intro_key !== "sterling" &&
      body.intro_key !== "crane"
    ) {
      res.status(400).json({ error: "invalid_intro_key" });
      return;
    }
    introKey = body.intro_key;
  }

  // Read existing arrays so we can merge idempotently. The audio columns are
  // added by `scripts/supabase-audio-tracking.sql`. If they're not yet present
  // (script not yet run), Supabase returns column errors — we surface 503 so
  // the client treats it as "feature not yet available" and moves on.
  const { data: row, error: selectErr } = await sb
    .from("leaderboard")
    .select("audio_listened, intros_listened")
    .eq("user_id", body.user_id)
    .maybeSingle();

  if (selectErr) {
    req.log.warn(
      { err: selectErr },
      "Audio columns missing? Run supabase-audio-tracking.sql in Supabase",
    );
    res.status(503).json({ error: "audio_columns_missing" });
    return;
  }

  const audioListened = new Set<number>(
    (row?.audio_listened as number[] | null) ?? [],
  );
  const introsListened = new Set<string>(
    (row?.intros_listened as string[] | null) ?? [],
  );
  if (dayNum !== null) audioListened.add(dayNum);
  if (introKey !== null) introsListened.add(introKey);

  const { error: updateErr } = await sb
    .from("leaderboard")
    .update({
      audio_listened: Array.from(audioListened).sort((a, b) => a - b),
      intros_listened: Array.from(introsListened),
      last_updated: new Date().toISOString(),
    })
    .eq("user_id", body.user_id);

  if (updateErr) {
    req.log.error({ err: updateErr }, "Audio listened update failed");
    res.status(500).json({ error: "update_failed", detail: updateErr.message });
    return;
  }
  res.json({ ok: true });
});

export default router;
