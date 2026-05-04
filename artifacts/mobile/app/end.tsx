import { Feather } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { C } from "@/constants/colors";
import {
  fetchLeaderboard,
  type LeaderboardPlayer,
} from "@/src/data/leaderboardApi";
import { fmtMoney, useStore } from "@/src/data/store";
import { FONT } from "@/src/theme/typography";
import { characterFace, endgameVideoUrl } from "@/src/utils/cloudinary";

const AUM_LOGO = require("@/assets/images/aum_logo.png");

const GOLD = "#C8A96E";
const GOLD_TINT = "#f5edd9";
const PARCHMENT = "#fdfcf8";
const PARCHMENT_BORDER = "#e9e2d2";
const RED = "#CC0000";
const INK = "#3C4858";
const SUBTLE_INK = "#6b7280";

const COMPLETION_COPY =
  "has completed the 49-day Sovereign Mandate Curriculum and " +
  "discharged the duties of the AUM Trust with discipline, conviction, " +
  "and the long view that defines the institutional voice.";

const VICTOR_CLOSING =
  '"Forty-nine days. Most flinched at twelve. You did not. ' +
  "The mandate is closed; the flame is yours to carry. " +
  'The market never closes — and neither do we."';

function useStaggered(): {
  seal: Animated.Value;
  cert: Animated.Value;
  certY: Animated.Value;
  buttons: Animated.Value;
  buttonsY: Animated.Value;
  trio: Animated.Value;
  trioY: Animated.Value;
  board: Animated.Value;
  boardY: Animated.Value;
  quote: Animated.Value;
  quoteY: Animated.Value;
} {
  const seal = useRef(new Animated.Value(0)).current;
  const cert = useRef(new Animated.Value(0)).current;
  const certY = useRef(new Animated.Value(18)).current;
  const buttons = useRef(new Animated.Value(0)).current;
  const buttonsY = useRef(new Animated.Value(12)).current;
  const trio = useRef(new Animated.Value(0)).current;
  const trioY = useRef(new Animated.Value(12)).current;
  const board = useRef(new Animated.Value(0)).current;
  const boardY = useRef(new Animated.Value(18)).current;
  const quote = useRef(new Animated.Value(0)).current;
  const quoteY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const fade = (v: Animated.Value, duration = 600, delay = 0) =>
      Animated.timing(v, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    const slide = (v: Animated.Value, duration = 600, delay = 0) =>
      Animated.timing(v, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });

    Animated.parallel([
      fade(seal, 500, 200),
      fade(cert, 700, 600),
      slide(certY, 700, 600),
      fade(buttons, 500, 1100),
      slide(buttonsY, 500, 1100),
      fade(trio, 600, 1300),
      slide(trioY, 600, 1300),
      fade(board, 600, 1600),
      slide(boardY, 600, 1600),
      fade(quote, 600, 2000),
      slide(quoteY, 600, 2000),
    ]).start();
  }, [
    seal,
    cert,
    certY,
    buttons,
    buttonsY,
    trio,
    trioY,
    board,
    boardY,
    quote,
    quoteY,
  ]);

  return {
    seal,
    cert,
    certY,
    buttons,
    buttonsY,
    trio,
    trioY,
    board,
    boardY,
    quote,
    quoteY,
  };
}

function usePulse(): Animated.Value {
  const v = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return v;
}

function todayLabel(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// One column inside "THE DESK YOU SERVED" — a circular Cloudinary face
// (or a 2-letter gold mark fallback if the URL is null), the character's
// full name in serif semibold, and an italic role tagline. Three of
// these stack horizontally with equal flex so they share the row evenly
// at any screen width.
function TrioCard({
  faceUrl,
  fallback,
  name,
  sub,
}: {
  faceUrl: string | null;
  fallback: string;
  name: string;
  sub: string;
}) {
  return (
    <View style={styles.trioCard}>
      {faceUrl ? (
        <Image
          source={{ uri: faceUrl }}
          style={styles.trioPortrait}
          accessible
          accessibilityRole="image"
          accessibilityLabel={name}
        />
      ) : (
        <View
          style={[styles.trioPortrait, styles.trioPortraitFallback]}
          accessible
          accessibilityRole="image"
          accessibilityLabel={name}
        >
          <Text style={styles.trioFallbackMark}>{fallback}</Text>
        </View>
      )}
      <Text style={styles.trioName} numberOfLines={2}>
        {name}
      </Text>
      <Text style={styles.trioSub} numberOfLines={1}>
        {sub}
      </Text>
    </View>
  );
}

export default function EndScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { displayName, trustBalance, userId, daysCompleted, loaded } =
    useStore();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const isPreview = preview === "1";

  // Hard gate: this screen is only reachable after Day 49 closeout. A
  // direct deep-link or accidental nav before then bounces the user back
  // to the ledger (we wait for `loaded` so we don't bounce on first paint
  // while AsyncStorage is still hydrating).
  // The `?preview=1` query param bypasses the guard so designers / the
  // canvas board can render the screen against fallback data.
  useEffect(() => {
    if (loaded && !isPreview && !daysCompleted.includes(49)) {
      router.replace("/(tabs)/ledger");
    }
  }, [loaded, daysCompleted, router, isPreview]);

  const anim = useStaggered();
  const pulse = usePulse();

  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const certRef = useRef<View>(null);
  const discordUrl = process.env.EXPO_PUBLIC_DISCORD_INVITE_URL ?? "";

  // All three named characters get Cloudinary face crops on the End
  // screen so the closing tableau credits the full cast (Sterling the
  // Trustee, Buckley the founder in memoriam, Victor the antagonist).
  // URLs are stable per-character — memoize once per mount.
  const trioFaces = useMemo(
    () => ({
      sterling: characterFace("sterling", 56),
      barnaby: characterFace("barnaby", 56),
      victor: characterFace("victor", 56),
    }),
    [],
  );

  useEffect(() => {
    let active = true;
    fetchLeaderboard()
      .then((rows) => {
        if (!active) return;
        setPlayers(rows);
        setBoardLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setBoardLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Compute the player's rank inside the FULL board (server returns up to 200,
  // already sorted by trust_balance DESC). Top 10 are always rendered;
  // if the player is below the cut, we pin a "you" row beneath the top 10.
  const { top10, playerRank } = useMemo(() => {
    const top = players.slice(0, 10);
    const idx = userId ? players.findIndex((p) => p.user_id === userId) : -1;
    return { top10: top, playerRank: idx >= 0 ? idx + 1 : null };
  }, [players, userId]);

  const playerInTop10 =
    playerRank !== null && playerRank > 0 && playerRank <= 10;

  const onShareCertificate = async (): Promise<void> => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(certRef, {
        format: "png",
        quality: 1,
      });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "AUM — Certificate of Mandate Completion",
        });
      }
    } catch (err) {
      console.warn("[end] share certificate failed", err);
    } finally {
      setSharing(false);
    }
  };

  const onJoinDiscord = (): void => {
    if (!discordUrl) return;
    Linking.openURL(discordUrl).catch((err) =>
      console.warn("[end] open discord failed", err),
    );
  };

  return (
    <View style={styles.root}>
      {/* Layer 1 — looping CHF-bills background video at 0.35 opacity. */}
      <Video
        source={{ uri: endgameVideoUrl() }}
        isLooping
        shouldPlay
        isMuted
        resizeMode={ResizeMode.COVER}
        style={[StyleSheet.absoluteFillObject, styles.video]}
      />
      {/* Subtle parchment veil so text on top stays legible. */}
      <View style={styles.veil} />

      {/* Tiny dismiss affordance so the screen is not a dead-end. */}
      <Pressable
        onPress={() => router.replace("/(tabs)/ledger")}
        style={[styles.dismiss, { top: insets.top + 8 }]}
        hitSlop={12}
      >
        <Feather name="x" size={20} color={INK} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 64 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Seal — appears first. AUM brand logo over a thin gold rule. */}
        <Animated.View style={[styles.sealWrap, { opacity: anim.seal }]}>
          <Image
            source={AUM_LOGO}
            style={styles.sealLogo}
            resizeMode="contain"
            accessibilityLabel="AUM"
          />
          <View style={styles.sealRule} />
          <Text style={styles.sealCaption}>MANDATE CLOSED · DAY 49</Text>
        </Animated.View>

        {/* Layer 2 — Certificate card. */}
        <Animated.View
          style={[
            styles.certShadow,
            {
              opacity: anim.cert,
              transform: [{ translateY: anim.certY }],
            },
          ]}
        >
          <View ref={certRef} collapsable={false} style={styles.cert}>
            <View style={styles.certGoldBar} />
            <View style={styles.certBody}>
              <Text style={styles.certEyebrow}>
                CERTIFICATE OF MANDATE COMPLETION
              </Text>
              <Text style={styles.certIntro}>This certifies that</Text>
              <Text style={styles.certName} numberOfLines={2}>
                {displayName || "Anonymous Steward"}
              </Text>
              <Text style={styles.certBlurb}>{COMPLETION_COPY}</Text>

              <View style={styles.certRule} />

              <Text style={styles.certNumber}>{fmtMoney(trustBalance)}</Text>
              <Text style={styles.certNumberCaption}>
                FINAL ASSETS UNDER MANAGEMENT
              </Text>

              <View style={styles.certFooter}>
                <View style={styles.certFooterCol}>
                  <Text style={styles.certFooterLabel}>VICTOR CRANE</Text>
                  <Text style={styles.certFooterSub}>
                    Chief Antagonist · AUM
                  </Text>
                </View>
                <View
                  style={[styles.certFooterCol, styles.certFooterColRight]}
                >
                  <Text style={styles.certFooterLabel}>DAY 49</Text>
                  <Text style={styles.certFooterSub}>{todayLabel()}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Action row — share + community. */}
        <Animated.View
          style={[
            styles.actionRow,
            {
              opacity: anim.buttons,
              transform: [{ translateY: anim.buttonsY }],
            },
          ]}
        >
          <Pressable
            onPress={onShareCertificate}
            disabled={sharing}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionInk,
              pressed && styles.pressed,
              sharing && styles.disabled,
            ]}
          >
            <Feather name="download" size={14} color="#FFFFFF" />
            <Text style={styles.actionInkLabel}>
              {sharing ? "PREPARING…" : "DOWNLOAD CERTIFICATE"}
            </Text>
          </Pressable>
          <Pressable
            onPress={onJoinDiscord}
            disabled={!discordUrl}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionRed,
              pressed && styles.pressed,
              !discordUrl && styles.disabled,
            ]}
          >
            <Feather name="message-circle" size={14} color={RED} />
            <Text style={styles.actionRedLabel}>JOIN THE COMMUNITY</Text>
          </Pressable>
        </Animated.View>

        {/* The three named characters who animated the 49-day mandate.
            All three portraits are pulled from the Cloudinary AUM-TITANS
            folder via `characterFace(...)` — never from local
            `assets/images/*.png`, which exist only as legacy fallbacks. */}
        <Animated.View
          style={[
            styles.trioWrap,
            {
              opacity: anim.trio,
              transform: [{ translateY: anim.trioY }],
            },
          ]}
        >
          <Text style={styles.trioEyebrow}>THE DESK YOU SERVED</Text>
          <View style={styles.trioRow}>
            <TrioCard
              faceUrl={trioFaces.sterling}
              fallback="AS"
              name="Arthur Sterling"
              sub="Your Trustee"
            />
            <TrioCard
              faceUrl={trioFaces.barnaby}
              fallback="BB"
              name="Barnaby Buckley"
              sub="Founder · 1934–2025"
            />
            <TrioCard
              faceUrl={trioFaces.victor}
              fallback="VC"
              name="Victor Crane"
              sub="Chief Antagonist"
            />
          </View>
        </Animated.View>

        {/* Layer 3 — Top-10 leaderboard. */}
        <Animated.View
          style={[
            styles.boardWrap,
            {
              opacity: anim.board,
              transform: [{ translateY: anim.boardY }],
            },
          ]}
        >
          <View style={styles.boardHeader}>
            <Text style={styles.boardEyebrow}>FINAL STANDINGS · TOP 10</Text>
            <View style={styles.live}>
              <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
              <Text style={styles.liveLabel}>LIVE</Text>
            </View>
          </View>

          {boardLoading ? (
            <View style={styles.boardEmpty}>
              <Text style={styles.boardEmptyText}>Tallying the desk…</Text>
            </View>
          ) : top10.length === 0 ? (
            <View style={styles.boardEmpty}>
              <Text style={styles.boardEmptyText}>
                The desk is quiet. Be the first to post a closing balance.
              </Text>
            </View>
          ) : (
            <View>
              {top10.map((p, i) => {
                const isYou = !!userId && p.user_id === userId;
                return (
                  <View
                    key={p.user_id}
                    style={[styles.row, isYou && styles.rowYou]}
                  >
                    <Text style={[styles.rank, isYou && styles.rankYou]}>
                      #{i + 1}
                    </Text>
                    <Text
                      style={[styles.name, isYou && styles.nameYou]}
                      numberOfLines={1}
                    >
                      {isYou ? `YOU — ${p.display_name}` : p.display_name}
                    </Text>
                    <Text style={[styles.nav, isYou && styles.navYou]}>
                      {fmtMoney(p.trust_balance)}
                    </Text>
                  </View>
                );
              })}

              {!playerInTop10 && playerRank !== null ? (
                <>
                  <View style={styles.boardSplit}>
                    <Text style={styles.boardSplitText}>· · ·</Text>
                  </View>
                  <View style={[styles.row, styles.rowYou]}>
                    <Text style={[styles.rank, styles.rankYou]}>
                      #{playerRank}
                    </Text>
                    <Text style={[styles.name, styles.nameYou]} numberOfLines={1}>
                      YOU — {displayName || "Anonymous Steward"}
                    </Text>
                    <Text style={[styles.nav, styles.navYou]}>
                      {fmtMoney(trustBalance)}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          )}
        </Animated.View>

        {/* Victor Crane closing quote. */}
        <Animated.View
          style={[
            styles.quoteWrap,
            {
              opacity: anim.quote,
              transform: [{ translateY: anim.quoteY }],
            },
          ]}
        >
          <View style={styles.quoteBar} />
          <View style={styles.quoteBody}>
            <Text style={styles.quoteText}>{VICTOR_CLOSING}</Text>
            <Text style={styles.quoteAuthor}>— VICTOR CRANE</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PARCHMENT,
  },
  video: {
    opacity: 0.35,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(250, 250, 250, 0.45)",
  },
  dismiss: {
    position: "absolute",
    right: 14,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(60,72,88,0.15)",
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  sealWrap: {
    alignItems: "center",
    marginBottom: 18,
  },
  sealLogo: {
    width: 132,
    height: 48,
  },
  sealRule: {
    height: 1,
    width: 64,
    backgroundColor: GOLD,
    opacity: 0.7,
    marginTop: 10,
  },
  sealCaption: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 10,
    color: SUBTLE_INK,
    letterSpacing: 2,
    marginTop: 10,
  },
  certShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  cert: {
    backgroundColor: PARCHMENT,
    borderWidth: 1,
    borderColor: PARCHMENT_BORDER,
  },
  certGoldBar: {
    height: 4,
    backgroundColor: GOLD,
  },
  certBody: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
  },
  certEyebrow: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 11,
    color: GOLD,
    letterSpacing: 2.5,
    textAlign: "center",
  },
  certIntro: {
    fontFamily: FONT.serifItalic,
    fontSize: 16,
    color: SUBTLE_INK,
    textAlign: "center",
    marginTop: 18,
  },
  certName: {
    fontFamily: FONT.serifSemiBold,
    fontSize: 30,
    lineHeight: 36,
    color: INK,
    textAlign: "center",
    marginTop: 6,
  },
  certBlurb: {
    fontFamily: FONT.serifItalic,
    fontSize: 15,
    lineHeight: 22,
    color: SUBTLE_INK,
    textAlign: "center",
    marginTop: 14,
  },
  certRule: {
    height: 1,
    backgroundColor: GOLD,
    opacity: 0.6,
    marginVertical: 22,
    alignSelf: "center",
    width: 80,
  },
  certNumber: {
    fontFamily: FONT.serifSemiBold,
    fontSize: 34,
    lineHeight: 40,
    color: INK,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  certNumberCaption: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 10,
    color: SUBTLE_INK,
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 6,
  },
  certFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: PARCHMENT_BORDER,
  },
  certFooterCol: {
    flex: 1,
  },
  certFooterColRight: {
    alignItems: "flex-end",
  },
  certFooterLabel: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 10,
    color: INK,
    letterSpacing: 1.6,
  },
  certFooterSub: {
    fontFamily: FONT.serifItalic,
    fontSize: 12,
    color: SUBTLE_INK,
    marginTop: 2,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 2,
  },
  actionInk: {
    backgroundColor: INK,
    borderColor: INK,
  },
  actionInkLabel: {
    color: "#FFFFFF",
    fontFamily: FONT.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  actionRed: {
    backgroundColor: "#FFFFFF",
    borderColor: RED,
  },
  actionRedLabel: {
    color: RED,
    fontFamily: FONT.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },

  trioWrap: {
    marginTop: 22,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: C.divider,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
  },
  trioEyebrow: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 10,
    color: GOLD,
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 14,
  },
  trioRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  trioCard: {
    flex: 1,
    alignItems: "center",
  },
  trioPortrait: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GOLD_TINT,
  },
  trioPortraitFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GOLD,
  },
  trioFallbackMark: {
    fontFamily: FONT.serifSemiBold,
    fontSize: 18,
    color: GOLD,
    letterSpacing: 1,
  },
  trioName: {
    fontFamily: FONT.serifSemiBold,
    fontSize: 13,
    lineHeight: 16,
    color: INK,
    marginTop: 8,
    textAlign: "center",
  },
  trioSub: {
    fontFamily: FONT.serifItalic,
    fontSize: 11,
    lineHeight: 14,
    color: SUBTLE_INK,
    marginTop: 2,
    textAlign: "center",
  },

  boardWrap: {
    marginTop: 26,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: C.divider,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  boardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  boardEyebrow: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 11,
    color: INK,
    letterSpacing: 2,
  },
  live: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    backgroundColor: RED,
  },
  liveLabel: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 10,
    color: RED,
    letterSpacing: 1.6,
  },
  boardEmpty: {
    paddingVertical: 22,
    alignItems: "center",
  },
  boardEmptyText: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: SUBTLE_INK,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingHorizontal: 4,
  },
  rowYou: {
    backgroundColor: "rgba(204,0,0,0.04)",
    borderLeftWidth: 2,
    borderLeftColor: RED,
    paddingLeft: 10,
  },
  rank: {
    fontFamily: FONT.mono,
    fontSize: 13,
    color: SUBTLE_INK,
    width: 38,
  },
  rankYou: {
    color: RED,
    fontFamily: FONT.monoBold,
  },
  name: {
    flex: 1,
    fontFamily: FONT.bodyMedium,
    fontSize: 14,
    color: INK,
  },
  nameYou: {
    fontFamily: FONT.bodySemiBold,
    color: RED,
  },
  nav: {
    fontFamily: FONT.monoBold,
    fontSize: 13,
    color: INK,
  },
  navYou: { color: RED },
  boardSplit: {
    paddingVertical: 6,
    alignItems: "center",
  },
  boardSplitText: {
    fontFamily: FONT.body,
    fontSize: 14,
    color: SUBTLE_INK,
    letterSpacing: 4,
  },

  quoteWrap: {
    flexDirection: "row",
    marginTop: 26,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: C.divider,
  },
  quoteBar: {
    width: 2,
    backgroundColor: RED,
  },
  quoteBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  quoteText: {
    fontFamily: FONT.serifItalic,
    fontSize: 16,
    lineHeight: 24,
    color: INK,
  },
  quoteAuthor: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 10,
    color: SUBTLE_INK,
    letterSpacing: 2,
    marginTop: 12,
  },
});
