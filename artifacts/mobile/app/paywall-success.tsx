// AUM — Stripe paywall success screen.
//
// Stripe redirects here after a successful Checkout with
// ?session_id=cs_…. We:
//   1. Verify the session with our server (which also flips the server
//      mandate_unlocked flag — primary unlock path, webhook is backup).
//   2. Flip the local mandateUnlocked flag.
//   3. Show "The Mandate is yours." + player name + transaction
//      reference, then auto-navigate to Day 2 after a 3-second countdown.

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useStore } from "@/src/data/store";
import {
  fetchStripeSession,
  type StripeSessionInfo,
} from "@/src/data/leaderboardApi";
import { FONT } from "@/src/theme/typography";

const GOLD = "#C8A96E";
const RED = "#CC0000";
const INK_DEEP = "#1a1a1a";
const INK_BODY = "#666666";
const INK_DIM = "#888888";

export default function PaywallSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams<{ session_id?: string }>();
  const sessionId = params.session_id ?? "";
  const { userId, displayName, setMandateUnlocked } = useStore();

  const [info, setInfo] = useState<StripeSessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  // Verify session with server (which also unlocks the player's row).
  useEffect(() => {
    let cancelled = false;
    if (!sessionId || !sessionId.startsWith("cs_")) {
      setError("Missing or invalid Stripe session reference.");
      return;
    }
    if (!userId) {
      setError(
        "Your account isn't fully initialised. Refresh the page and try again.",
      );
      return;
    }
    void (async () => {
      // The server binds verification to userId — a leaked session_id
      // from another account comes back as paid:false / user_mismatch.
      const result = await fetchStripeSession(sessionId, userId);
      if (cancelled) return;
      if (!result) {
        setError("Couldn't verify your payment. Please refresh in a moment.");
        return;
      }
      setInfo(result);
      // Belt-and-braces: never local-unlock unless the server confirms
      // BOTH that the session is paid AND that its metadata.user_id
      // matches us.
      if (result.paid && result.user_id === userId) {
        await setMandateUnlocked(true);
      } else if (result.error === "user_mismatch") {
        setError(
          "This payment was made for a different account. Please pay from the device you're playing on.",
        );
      } else if (result.error === "product_mismatch") {
        setError("This payment is not for the AUM Mandate.");
      } else {
        setError(
          "This Stripe session hasn't completed payment yet. If you just paid, refresh in a moment.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, setMandateUnlocked]);

  // 3-second countdown → /day/2 (only when paid AND bound to this user).
  useEffect(() => {
    if (!info?.paid || info.user_id !== userId) return;
    if (countdown <= 0) {
      router.replace("/day/2" as never);
      return;
    }
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, info?.paid, info?.user_id, userId, router]);

  const playerName = info?.display_name?.trim() || displayName || "Steward";
  const reference = info?.reference ?? "";
  const amountText = info
    ? `${info.currency} ${(info.amount_total / 100).toFixed(2)}`
    : "USD 9.99";

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.seal}>
          <Text style={styles.sealMark}>AUM</Text>
          <View style={styles.sealRule} />
          <Text style={styles.sealCaption}>MANDATE OPEN · SEASON I</Text>
        </View>

        {error ? (
          <>
            <Text style={[styles.headline, { color: RED }]}>
              Payment not confirmed.
            </Text>
            <Text style={styles.error}>{error}</Text>
          </>
        ) : !info ? (
          <Text style={styles.body}>Verifying your payment…</Text>
        ) : (
          <>
            <Text style={styles.headline}>The Mandate is yours.</Text>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>STEWARD</Text>
              <Text style={styles.rowValue}>{playerName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>AMOUNT</Text>
              <Text style={styles.rowValueMono}>{amountText}</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.rowLabel}>REFERENCE</Text>
              <Text style={styles.rowValueMonoSmall} numberOfLines={1}>
                {reference}
              </Text>
            </View>

            <View style={styles.countdownBlock}>
              <Text style={styles.countdownText}>
                Proceeding to Day 2 in {countdown}…
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 60,
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
    marginBottom: 32,
  },
  body: {
    fontFamily: FONT.serifItalic,
    fontSize: 16,
    lineHeight: 26,
    color: INK_BODY,
    textAlign: "center",
  },
  error: {
    fontFamily: FONT.mono,
    fontSize: 12,
    color: RED,
    textAlign: "center",
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    gap: 12,
  },
  rowLabel: {
    fontFamily: FONT.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: INK_DIM,
  },
  rowValue: {
    flex: 1,
    textAlign: "right",
    fontFamily: FONT.serifSemiBold,
    fontSize: 18,
    color: INK_DEEP,
  },
  rowValueMono: {
    flex: 1,
    textAlign: "right",
    fontFamily: FONT.monoBold,
    fontSize: 16,
    color: INK_DEEP,
  },
  rowValueMonoSmall: {
    flex: 1,
    textAlign: "right",
    fontFamily: FONT.mono,
    fontSize: 11,
    color: INK_BODY,
  },
  countdownBlock: {
    marginTop: 40,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: GOLD,
    alignItems: "center",
  },
  countdownText: {
    fontFamily: FONT.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: GOLD,
  },
});
