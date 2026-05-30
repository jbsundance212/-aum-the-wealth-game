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

## Credentials: direct Secrets, NOT the Replit Stripe connector
`getUncachableStripeClient()` reads the `STRIPE_SECRET_KEY` secret directly (and
`getStripePublishableKey()` reads `STRIPE_PUBLISHABLE_KEY`). The Replit Stripe
connector/sandbox was removed at the user's request — they manage **live** `sk_live_…`
keys in Secrets and the app accepts real payments.
**Why:** the user already had live keys + a confirmed live transaction and explicitly did
not want the Replit sandbox in the loop.
**How to apply:** secrets are global (available in dev + prod), so dev and prod both hit
the **live** Stripe account now — there is no `REPLIT_DEPLOYMENT`-based dev/prod account
switch anymore. Test card `4242…` only works if the configured keys are swapped to
`sk_test_…`/`pk_test_…`. Don't reintroduce `$REPLIT_CONNECTORS_HOSTNAME` logic.
