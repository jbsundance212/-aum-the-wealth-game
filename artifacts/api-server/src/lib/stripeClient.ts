// Stripe client for the AUM paywall.
//
// Credentials are sourced from Replit's native Stripe integration (the
// Connectors proxy at $REPLIT_CONNECTORS_HOSTNAME) — no STRIPE_SECRET_KEY
// env var is needed. The connector automatically routes between the
// `development` and `production` Stripe accounts based on
// REPLIT_DEPLOYMENT.
//
// We deliberately do NOT use `stripe-replit-sync`. The skill recommends it
// when you want to mirror Stripe's product/price/customer tables into a
// local PostgreSQL — but AUM has exactly one product (a $9.99 unlock) and
// no Replit-managed PG (we use Supabase for player state). The unlock
// boolean lives in `leaderboard.mandate_unlocked`; Supabase is the source
// of truth.

import Stripe from "stripe";

type ConnectionSettings = {
  publishable?: string;
  secret?: string;
};

async function getCredentials(): Promise<{
  publishableKey: string;
  secretKey: string;
}> {
  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const xReplitToken = process.env["REPL_IDENTITY"]
    ? "repl " + process.env["REPL_IDENTITY"]
    : process.env["WEB_REPL_RENEWAL"]
      ? "depl " + process.env["WEB_REPL_RENEWAL"]
      : null;

  if (!hostname) {
    throw new Error("REPLIT_CONNECTORS_HOSTNAME not set");
  }
  if (!xReplitToken) {
    throw new Error("X-Replit-Token not found for repl/depl");
  }

  const isProduction = process.env["REPLIT_DEPLOYMENT"] === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Replit-Token": xReplitToken,
    },
  });

  const data = (await response.json()) as {
    items?: Array<{ settings?: ConnectionSettings }>;
  };
  const settings = data.items?.[0]?.settings;

  if (!settings || !settings.publishable || !settings.secret) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: settings.publishable,
    secretKey: settings.secret,
  };
}

// WARNING: Never cache this client. Tokens expire — always fetch fresh.
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, {
    // Latest API version per Replit Stripe blueprint snippet — do not
    // downgrade.
    apiVersion: "2025-11-17.clover",
  });
}

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}
