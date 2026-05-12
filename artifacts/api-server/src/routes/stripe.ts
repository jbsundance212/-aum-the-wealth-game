// Stripe checkout + status routes for the AUM paywall.
//
// The webhook (`POST /api/stripe/webhook`) is registered separately in
// `app.ts` because it needs the raw request body BEFORE `express.json()`
// runs. Everything in this router runs after the JSON parser.
//
// Flow:
//   1. Mobile → POST /api/stripe/checkout    → returns { url } to Stripe
//   2. User pays at Stripe Checkout
//   3a. Stripe redirects to ${return_origin}/paywall-success?session_id=…
//       which calls GET /api/stripe/session — this is the PRIMARY unlock
//       path (server verifies the session with Stripe's API, then upserts
//       mandate_unlocked=true into Supabase).
//   3b. In parallel Stripe fires the webhook (best-effort backup if the
//       user closed the success tab before the redirect landed).
//   4. Mobile → GET /api/stripe/status?user_id=… on focus to refresh.

import { Router, type IRouter } from "express";

import { getSupabase } from "../lib/supabase";
import { getUncachableStripeClient } from "../lib/stripeClient";

const router: IRouter = Router();

const PRODUCT_NAME = "The Mandate Unlock";
const PRODUCT_DESCRIPTION =
  "AUM — The Wealth Game · Season I · Days 2 through 49 of the Vane-Buckley Trust mandate.";
const PRODUCT_TAG = "AUM_MANDATE_SEASON_1";
const PRICE_USD_CENTS = 999;

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    )
  );
}

// Make sure return_origin is a real http(s) URL we trust to redirect to.
// Stripe rejects non-http URLs anyway, but we sanitise to avoid surprises.
function normaliseOrigin(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

// POST /api/stripe/checkout ----------------------------------------------------
router.post("/stripe/checkout", async (req, res) => {
  const body = (req.body ?? {}) as {
    user_id?: unknown;
    display_name?: unknown;
    return_origin?: unknown;
  };

  if (!isUuid(body.user_id)) {
    res.status(400).json({ error: "invalid_user_id" });
    return;
  }
  const displayName =
    typeof body.display_name === "string"
      ? body.display_name.slice(0, 60).trim()
      : "";
  const origin = normaliseOrigin(body.return_origin);
  if (!origin) {
    res.status(400).json({ error: "invalid_return_origin" });
    return;
  }

  let stripe;
  try {
    stripe = await getUncachableStripeClient();
  } catch (err) {
    req.log.error({ err }, "Stripe client init failed");
    res.status(503).json({ error: "stripe_unavailable" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: PRICE_USD_CENTS,
            product_data: {
              name: PRODUCT_NAME,
              description: PRODUCT_DESCRIPTION,
            },
          },
        },
      ],
      // Metadata flows to both the Checkout Session AND the resulting
      // PaymentIntent — so either the webhook OR the success-URL round-trip
      // can recover the user_id.
      metadata: {
        user_id: body.user_id,
        display_name: displayName,
        product: PRODUCT_TAG,
      },
      payment_intent_data: {
        metadata: {
          user_id: body.user_id,
          display_name: displayName,
          product: PRODUCT_TAG,
        },
      },
      success_url: `${origin}/paywall-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/paywall`,
    });

    if (!session.url) {
      res.status(500).json({ error: "no_session_url" });
      return;
    }
    res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    req.log.error({ err }, "Stripe checkout session create failed");
    res.status(500).json({
      error: "checkout_create_failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

// GET /api/stripe/status -------------------------------------------------------
router.get("/stripe/status", async (req, res) => {
  const userId = req.query["user_id"];
  if (!isUuid(userId)) {
    res.status(400).json({ error: "invalid_user_id" });
    return;
  }

  const sb = getSupabase();
  if (!sb) {
    res.status(503).json({ error: "leaderboard_unavailable" });
    return;
  }

  const { data, error } = await sb
    .from("leaderboard")
    .select("mandate_unlocked")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    req.log.error({ err: error }, "Stripe status lookup failed");
    res.status(500).json({ error: "status_lookup_failed" });
    return;
  }

  res.json({ mandate_unlocked: Boolean(data?.mandate_unlocked) });
});

// GET /api/stripe/session ------------------------------------------------------
// Verifies a Checkout Session with Stripe directly (server-trusted), then
// flips the player's mandate_unlocked flag to true if paid. This is the
// PRIMARY unlock path — the webhook is just a backup.
//
// Optional `user_id` query param binds the verification to a specific
// player. If provided AND it does not match the metadata.user_id stored
// on the Stripe session, we explicitly return `paid: false` and refuse
// the upsert — this stops a leaked/shared `cs_…` URL from unlocking
// another player's account.
router.get("/stripe/session", async (req, res) => {
  const sessionId = req.query["session_id"];
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    res.status(400).json({ error: "invalid_session_id" });
    return;
  }
  const callerUserId =
    typeof req.query["user_id"] === "string" ? req.query["user_id"] : null;
  if (callerUserId !== null && !isUuid(callerUserId)) {
    res.status(400).json({ error: "invalid_user_id" });
    return;
  }

  let stripe;
  try {
    stripe = await getUncachableStripeClient();
  } catch (err) {
    req.log.error({ err }, "Stripe client init failed");
    res.status(503).json({ error: "stripe_unavailable" });
    return;
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    req.log.error({ err }, "Stripe session retrieve failed");
    res.status(404).json({ error: "session_not_found" });
    return;
  }

  const stripePaid = session.payment_status === "paid";
  const userId =
    typeof session.metadata?.["user_id"] === "string"
      ? session.metadata["user_id"]
      : null;
  const productTag =
    typeof session.metadata?.["product"] === "string"
      ? session.metadata["product"]
      : null;
  const displayName =
    typeof session.metadata?.["display_name"] === "string"
      ? session.metadata["display_name"]
      : "";
  const reference =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.id;

  // Reject mismatched bindings — caller asked about a session that was
  // not paid by them. This is the security gate the client trusts.
  const userMismatch =
    callerUserId !== null && userId !== null && callerUserId !== userId;
  // Defence in depth — a paid session for some OTHER product (if we ever
  // add more) should not unlock the mandate.
  const productMismatch = productTag !== null && productTag !== PRODUCT_TAG;
  const paid = stripePaid && !userMismatch && !productMismatch;

  if (paid && userId && isUuid(userId)) {
    const sb = getSupabase();
    if (sb) {
      // Upsert so a payment from a fresh device (no row yet) still lands.
      const upsertRow: Record<string, unknown> = {
        user_id: userId,
        mandate_unlocked: true,
        last_updated: new Date().toISOString(),
      };
      if (displayName) upsertRow["display_name"] = displayName;

      const { error } = await sb
        .from("leaderboard")
        .upsert(upsertRow, { onConflict: "user_id" });
      if (error) {
        req.log.error(
          { err: error, userId },
          "Mandate unlock upsert (session route) failed",
        );
      } else {
        req.log.info({ userId }, "Mandate unlocked via session round-trip");
      }
    }
  }

  res.json({
    paid,
    user_id: userId,
    display_name: displayName,
    amount_total: session.amount_total ?? PRICE_USD_CENTS,
    currency: (session.currency ?? "usd").toUpperCase(),
    reference,
    // Surfaced for clearer client error messages.
    error: userMismatch
      ? "user_mismatch"
      : productMismatch
        ? "product_mismatch"
        : !stripePaid
          ? "not_paid"
          : null,
  });
});

export default router;
