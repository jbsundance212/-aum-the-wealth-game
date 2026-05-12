// AUM — Stripe paywall.
//
// Reached when a player tries to enter Day 2+ without an unlocked
// mandate (gated in `app/day/[id]/index.tsx`). The "Proceed to next
// day" button on Day 1's hub also routes here once Day 1 closes if
// the player hasn't paid.
//
// On tap we POST to /api/stripe/checkout, get back a Stripe-hosted
// Checkout URL, and redirect the browser to it. After payment Stripe
// returns the player to /paywall-success?session_id=… which verifies
// with Stripe and flips the local + server unlock flags.

import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Header } from "@/src/components/Header";
import { useStore } from "@/src/data/store";
import { createCheckoutSession } from "@/src/data/leaderboardApi";
import { FONT } from "@/src/theme/typography";

const GOLD = "#C8A96E";
const RED = "#CC0000";
const INK_DEEP = "#1a1a1a";
const INK_BODY = "#666666";
const INK_DIM = "#888888";
const INK_FAINT = "#cccccc";
const PAGE_BG = "#FFFFFF";

function getReturnOrigin(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }
  // Native fallback — Expo dev tunnel domain.
  const dev = process.env["EXPO_PUBLIC_DOMAIN"];
  if (dev) return `https://${dev}`;
  return "";
}

export default function Paywall() {
  const router = useRouter();
  const { userId, displayName, mandateUnlocked, refreshMandateStatus } =
    useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the player already paid (e.g. came from another tab) bounce them
  // straight into Day 2.
  useEffect(() => {
    if (mandateUnlocked) {
      router.replace("/day/2" as never);
    }
  }, [mandateUnlocked, router]);

  // Pull the latest server-side flag once on mount in case a previous
  // payment hadn't been mirrored locally yet.
  useEffect(() => {
    void refreshMandateStatus();
  }, [refreshMandateStatus]);

  const onUnlock = async () => {
    if (busy) return;
    setError(null);
    if (!userId) {
      setError(
        "Your account isn't fully initialised yet. Refresh the page and try again.",
      );
      return;
    }
    const origin = getReturnOrigin();
    if (!origin) {
      setError(
        "Can't determine the return URL on this device. Open the game in a browser and try again.",
      );
      return;
    }
    setBusy(true);
    const result = await createCheckoutSession({
      user_id: userId,
      display_name: displayName || "",
      return_origin: origin,
    });
    if (!result) {
      setError(
        "Couldn't open the secure checkout. Please try again in a moment.",
      );
      setBusy(false);
      return;
    }
    if (Platform.OS === "web" && typeof window !== "undefined") {
      // Same-tab redirect on web for cleanest UX.
      window.location.assign(result.url);
    } else {
      Linking.openURL(result.url).catch(() => {
        setError("Couldn't open the secure checkout in your browser.");
        setBusy(false);
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      <Header back title="The Mandate" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.seal}>
          <Text style={styles.sealMark}>AUM</Text>
          <View style={styles.sealRule} />
          <Text style={styles.sealCaption}>VANE-BUCKLEY TRUST · GENEVA</Text>
        </View>

        <Text style={styles.headline}>Enter The Mandate</Text>
        <Text style={styles.subhead}>
          49 DAYS · THE VANE-BUCKLEY TRUST · SEASON I
        </Text>

        <Text style={styles.body}>
          You have completed Day 1. Barnaby&apos;s estate awaits. Unlock the
          full Residency to continue.
        </Text>

        <View style={styles.priceBlock}>
          <Text style={styles.price}>USD 9.99</Text>
          <Text style={styles.priceSub}>ONE TIME · NO SUBSCRIPTION</Text>
        </View>

        <Pressable
          onPress={onUnlock}
          disabled={busy}
          style={({ pressed }) => [
            styles.cta,
            pressed && !busy ? { opacity: 0.88 } : null,
            busy ? { opacity: 0.6 } : null,
          ]}
        >
          <Text style={styles.ctaLabel}>
            {busy ? "OPENING SECURE CHECKOUT…" : "UNLOCK THE MANDATE"}
          </Text>
        </Pressable>

        <Text style={styles.security}>Secure payment via Stripe</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.quoteBlock}>
          <Text style={styles.quoteText}>
            Pay once. Learn what took me thirty years to understand.
          </Text>
          <Text style={styles.quoteAttr}>— Victor Crane</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 60,
    backgroundColor: PAGE_BG,
  },
  seal: { alignItems: "center", marginBottom: 36 },
  sealMark: {
    fontFamily: FONT.serifSemiBold,
    fontSize: 40,
    color: GOLD,
    letterSpacing: 6,
  },
  sealRule: {
    width: 56,
    height: 1,
    backgroundColor: GOLD,
    marginTop: 10,
    marginBottom: 10,
  },
  sealCaption: {
    fontFamily: FONT.mono,
    fontSize: 9,
    letterSpacing: 3,
    color: INK_DIM,
  },
  headline: {
    fontFamily: FONT.serif,
    fontSize: 36,
    lineHeight: 42,
    color: INK_DEEP,
    textAlign: "center",
    marginBottom: 12,
  },
  subhead: {
    fontFamily: FONT.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: INK_DIM,
    textAlign: "center",
    marginBottom: 26,
  },
  body: {
    fontFamily: FONT.serifItalic,
    fontSize: 16,
    lineHeight: 26,
    color: INK_BODY,
    textAlign: "center",
    marginBottom: 34,
  },
  priceBlock: { alignItems: "center", marginBottom: 28 },
  price: {
    fontFamily: FONT.monoBold,
    fontSize: 28,
    color: INK_DEEP,
    letterSpacing: -0.5,
  },
  priceSub: {
    fontFamily: FONT.mono,
    fontSize: 9,
    letterSpacing: 3,
    color: GOLD,
    marginTop: 8,
  },
  cta: {
    backgroundColor: GOLD,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: FONT.monoBold,
    fontSize: 13,
    letterSpacing: 2,
    color: "#FFFFFF",
  },
  security: {
    fontFamily: FONT.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: INK_FAINT,
    textAlign: "center",
    marginTop: 12,
  },
  error: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: RED,
    textAlign: "center",
    marginTop: 14,
  },
  quoteBlock: {
    marginTop: 48,
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: RED,
  },
  quoteText: {
    fontFamily: FONT.serifItalic,
    fontSize: 16,
    lineHeight: 24,
    color: INK_BODY,
  },
  quoteAttr: {
    fontFamily: FONT.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    color: INK_DIM,
    marginTop: 8,
  },
});
