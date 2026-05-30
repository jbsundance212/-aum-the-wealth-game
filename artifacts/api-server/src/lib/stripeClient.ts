// Stripe client for the AUM paywall.
//
// Credentials are sourced directly from environment secrets:
//   - STRIPE_SECRET_KEY      (sk_live_… / sk_test_…)
//   - STRIPE_PUBLISHABLE_KEY (pk_live_… / pk_test_…)
//
// We do NOT use Replit's native Stripe connector/sandbox integration. The
// live keys are managed by the user in Secrets and are the single source of
// Stripe credentials in every environment (development + production).
//
// We also deliberately do NOT use `stripe-replit-sync`. AUM has exactly one
// product (a $9.99 unlock) and no Replit-managed PG (we use Supabase for
// player state). The unlock boolean lives in `leaderboard.mandate_unlocked`;
// Supabase is the source of truth.

import Stripe from "stripe";

function requireSecretKey(): string {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return key;
}

// Exported as `getUncachableStripeClient` to preserve the call sites in
// routes/stripe.ts and routes/stripeWebhook.ts. Reads the secret fresh each
// call so a rotated key is picked up without a code change.
export async function getUncachableStripeClient(): Promise<Stripe> {
  return new Stripe(requireSecretKey(), {
    // Latest API version per Replit Stripe blueprint snippet — do not
    // downgrade.
    apiVersion: "2025-11-17.clover",
  });
}

export async function getStripePublishableKey(): Promise<string> {
  const key = process.env["STRIPE_PUBLISHABLE_KEY"];
  if (!key) {
    throw new Error("STRIPE_PUBLISHABLE_KEY is not set");
  }
  return key;
}
