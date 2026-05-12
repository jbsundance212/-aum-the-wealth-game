// Stripe webhook handler — registered DIRECTLY on the Express app in
// `app.ts` (not under the /api router) because it requires the raw
// request body for signature verification, which must run BEFORE the
// global `express.json()` middleware.
//
// Setup steps for the user (one-time):
//   1. Stripe dashboard → Developers → Webhooks → Add endpoint
//   2. URL: https://<your-replit-domain>/api/stripe/webhook
//   3. Events to send: checkout.session.completed
//   4. Copy the signing secret → add to Replit Secrets as
//      STRIPE_WEBHOOK_SECRET
//
// Until STRIPE_WEBHOOK_SECRET is set this endpoint refuses all traffic
// (503). Players still unlock fine because the success-URL round-trip in
// `routes/stripe.ts` (GET /api/stripe/session) is the primary unlock
// path; the webhook is only a backup for users who close the tab.

import type { RequestHandler } from "express";

import { logger } from "../lib/logger";
import { getSupabase } from "../lib/supabase";
import { getUncachableStripeClient } from "../lib/stripeClient";

let warnedNoSecret = false;

export const stripeWebhookHandler: RequestHandler = async (req, res) => {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) {
    if (!warnedNoSecret) {
      logger.warn(
        "Stripe webhook hit but STRIPE_WEBHOOK_SECRET is not set. " +
          "Falling back to success-URL round-trip only. Add the secret " +
          "from your Stripe webhook endpoint to enable webhook unlocks.",
      );
      warnedNoSecret = true;
    }
    res.status(503).json({ error: "webhook_not_configured" });
    return;
  }

  const sigHeader = req.headers["stripe-signature"];
  const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;
  if (!sig) {
    res.status(400).json({ error: "missing_signature" });
    return;
  }

  let stripe;
  try {
    stripe = await getUncachableStripeClient();
  } catch (err) {
    req.log.error({ err }, "Stripe client init failed in webhook");
    res.status(503).json({ error: "stripe_unavailable" });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, secret);
  } catch (err) {
    req.log.error({ err }, "Stripe webhook signature verification failed");
    res.status(400).json({ error: "invalid_signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      payment_status?: string;
      metadata?: Record<string, string> | null;
    };
    const paid = session.payment_status === "paid";
    const userId = session.metadata?.["user_id"];
    const displayName = session.metadata?.["display_name"] ?? "";

    if (paid && typeof userId === "string" && userId) {
      const sb = getSupabase();
      if (sb) {
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
            "Mandate unlock upsert (webhook) failed",
          );
        } else {
          req.log.info({ userId }, "Mandate unlocked via webhook");
        }
      }
    }
  }

  res.json({ received: true });
};
