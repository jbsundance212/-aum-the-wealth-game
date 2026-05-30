---
name: Stripe mandate unlock authorization
description: Non-obvious constraints around the AUM Stripe paywall unlock gate (Payment Link vs server session) and dev-vs-prod Stripe account routing.
---

# Stripe mandate unlock — authorization gate

The mandate unlock (`leaderboard.mandate_unlocked` in Supabase) is flipped server-side
in two places that MUST stay in lockstep: `GET /api/stripe/session` (primary, success-URL
round-trip) and the `checkout.session.completed` webhook (backup).

## Rule: unlock requires positive product authorization, never fail-open
Both paths require proof the paid session is for OUR product before unlocking:
- legacy server-created Checkout Session → `metadata.product === "AUM_MANDATE_SEASON_1"`, OR
- Stripe Payment Link session (carries NO product metadata) → must have a non-null
  `session.payment_link` AND `amount_total === 999` AND `currency === "usd"`, optionally
  pinned to an exact `plink_` id via env `STRIPE_MANDATE_PAYMENT_LINK_ID`.

**Why:** the original check only *rejected on metadata mismatch*, so Payment Link sessions
(metadata absent) passed unconditionally — any other paid $-session in the same Stripe
account with a UUID `client_reference_id` could have unlocked the mandate. Positive proof
closes that cross-product hole. The player-binding gate (caller `user_id` must match the
session's `metadata.user_id` OR `client_reference_id`) is separate and already correct.

## Gotcha: the live Payment Link is invisible from the dev/test Stripe account
`getUncachableStripeClient()` routes to the **development (test-mode)** Stripe account
unless `REPLIT_DEPLOYMENT=1`. The user's `buy.stripe.com/...` Payment Link lives in their
**live** account, so: listing payment links from dev returns 0, and a live `cs_…` session
cannot be retrieved/verified by the dev server. The full pay→verify→unlock round-trip only
works in the **deployed** app. This is why end-to-end payment can't be tested in dev.

## Sandbox note
`code_execution` sandbox has NO `process.env` (empty) and `node` is not on its shell PATH,
so connector-credentialed Stripe calls can't run there. Use a throwaway `.mjs` run via the
`bash` tool (which has the connector env) instead.
