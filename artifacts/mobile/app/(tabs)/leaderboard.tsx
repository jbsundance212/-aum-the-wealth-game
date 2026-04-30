import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { C } from "@/constants/colors";
import { Header } from "@/src/components/Header";
import {
  fetchLeaderboard,
  type LeaderboardPlayer,
} from "@/src/data/leaderboardApi";
import { STARTING_BALANCE, useStore } from "@/src/data/store";
import { FONT } from "@/src/theme/typography";

const VICTOR_MULTIPLIER = 1.08;
const POLL_MS = 15_000;

const DISCORD_INVITE_URL =
  process.env["EXPO_PUBLIC_DISCORD_INVITE_URL"] ?? "https://discord.gg/NamQ6VYc";

type DisplayRow = {
  user_id: string;
  display_name: string;
  trust_balance: number;
  days_completed: number;
  isYou: boolean;
  isVictor: boolean;
};

function fmtNav(n: number): string {
  if (n < 0) return `−$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export default function LeaderboardScreen() {
  const { userId, displayName, trustBalance, daysCompleted, setDisplayName, profile } =
    useStore();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<number>(0);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // Effective display name: explicit displayName > legacy profile.fullName > placeholder.
  // Only the first two are "real"; placeholder means we won't sync to the leaderboard.
  const effectiveName =
    displayName.trim() || profile?.fullName?.trim() || "";
  const hasRealName = effectiveName.length >= 2;

  // Poll the leaderboard while the screen is focused. Re-entrant fetches
  // are guarded by inFlightRef so a slow request can't pile up duplicate
  // network calls when the interval fires faster than the response.
  const inFlightRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const load = async () => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        try {
          const list = await fetchLeaderboard();
          if (!mounted) return;
          setPlayers(list);
          setLoading(false);
          setLastFetched(Date.now());
        } finally {
          inFlightRef.current = false;
        }
      };
      void load();
      const id = setInterval(load, POLL_MS);
      return () => {
        mounted = false;
        clearInterval(id);
      };
    }, []),
  );

  // Pulsing red LIVE dot
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Merge live player + remote roster + synthetic Victor at #1.
  const rows = useMemo<DisplayRow[]>(() => {
    // Roster from server, replacing the current player's row with the
    // freshest local values (so the UI is never stale relative to gameplay).
    const others: DisplayRow[] = players
      .filter((p) => p.user_id !== userId)
      .map((p) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        trust_balance: p.trust_balance,
        days_completed: p.days_completed,
        isYou: false,
        isVictor: false,
      }));

    // Always include the local player in the visualization, even if their
    // displayName isn't set yet (a placeholder row is better than absence).
    const youRow: DisplayRow | null = userId
      ? {
          user_id: userId,
          display_name: effectiveName || "You (set your name)",
          trust_balance: trustBalance,
          days_completed: daysCompleted.length,
          isYou: true,
          isVictor: false,
        }
      : null;

    const realPlayers = youRow ? [...others, youRow] : others;
    const maxReal = realPlayers.reduce(
      (m, r) => (r.trust_balance > m ? r.trust_balance : m),
      0,
    );

    // Floor Victor at STARTING_BALANCE so an empty leaderboard doesn't
    // make him look ridiculous (e.g. "$1.08").
    const victorBase = Math.max(maxReal, STARTING_BALANCE);
    const maxDays = realPlayers.length
      ? Math.max(...realPlayers.map((r) => r.days_completed))
      : 0;
    const victor: DisplayRow = {
      user_id: "victor-crane",
      display_name: "Victor Crane",
      trust_balance: Math.round(victorBase * VICTOR_MULTIPLIER),
      days_completed: Math.min(49, maxDays + 1),
      isYou: false,
      isVictor: true,
    };

    return [...realPlayers, victor].sort(
      (a, b) => b.trust_balance - a.trust_balance,
    );
  }, [players, userId, effectiveName, trustBalance, daysCompleted]);

  const openDiscord = useCallback(async () => {
    try {
      const can = await Linking.canOpenURL(DISCORD_INVITE_URL);
      if (can) await Linking.openURL(DISCORD_INVITE_URL);
    } catch {
      // ignore
    }
  }, []);

  const startEditName = useCallback(() => {
    setNameDraft(effectiveName);
    setEditingName(true);
  }, [effectiveName]);

  const saveName = useCallback(async () => {
    const v = nameDraft.trim();
    if (v.length < 2) return;
    await setDisplayName(v);
    setEditingName(false);
  }, [nameDraft, setDisplayName]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header
        eyebrow="THE TRUSTEES"
        title="Standings of the Vane-Buckley Cohort"
      />

      {/* LIVE indicator, top-right of the content area */}
      <View style={styles.liveBar}>
        <Animated.View
          style={[
            styles.liveDot,
            {
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 1],
              }),
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1.15],
                  }),
                },
              ],
            },
          ]}
        />
        <Text style={styles.liveLabel}>LIVE</Text>
        {lastFetched ? (
          <Text style={styles.liveMeta}>
            · UPDATED {new Date(lastFetched).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>
          STANDINGS · {rows.length} TRUSTEES
        </Text>

        {loading && rows.length <= 1 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={C.accent} />
            <Text style={styles.loadingText}>Loading the cohort…</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {rows.map((r, i) => (
              <View
                key={r.user_id}
                style={[
                  styles.row,
                  i > 0 && { borderTopWidth: 0 },
                  r.isYou && styles.rowYou,
                  r.isVictor && styles.rowVictor,
                ]}
              >
                <Text style={styles.rowRank}>
                  {String(i + 1).padStart(2, "0")}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.rowName,
                      r.isYou && { color: C.accent },
                      r.isVictor && { color: C.ink },
                    ]}
                    numberOfLines={1}
                  >
                    {r.display_name}
                    {r.isYou ? "  ←  you" : ""}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {r.isVictor
                      ? "Rival beneficiary"
                      : `Day ${r.days_completed} of 49`}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>{fmtNav(r.trust_balance)}</Text>
                  <Text style={styles.rowDays}>
                    {String(r.days_completed).padStart(2, "0")}/49
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* For users who haven't set a display name yet (e.g. from a prior
            onboarding before the name field existed) — surface a small inline
            editor so they can join the public leaderboard. */}
        {!hasRealName ? (
          <View style={styles.namePrompt}>
            {!editingName ? (
              <Pressable
                onPress={startEditName}
                style={({ pressed }) => [
                  styles.namePromptCta,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.namePromptLabel}>
                  SET YOUR DISPLAY NAME →
                </Text>
                <Text style={styles.namePromptHint}>
                  Required to appear on the public leaderboard.
                </Text>
              </Pressable>
            ) : (
              <View>
                <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="e.g. Margaret Vane-Buckley"
                  placeholderTextColor={C.inkMuted}
                  maxLength={60}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={styles.input}
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                />
                <View style={styles.editRow}>
                  <Pressable
                    onPress={() => setEditingName(false)}
                    style={({ pressed }) => [
                      styles.editBtnGhost,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Text style={styles.editBtnGhostLabel}>CANCEL</Text>
                  </Pressable>
                  <Pressable
                    onPress={saveName}
                    disabled={nameDraft.trim().length < 2}
                    style={({ pressed }) => [
                      styles.editBtn,
                      nameDraft.trim().length < 2 && { opacity: 0.4 },
                      pressed && nameDraft.trim().length >= 2 && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.editBtnLabel}>SAVE</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        ) : null}

        <Pressable
          onPress={openDiscord}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.ctaLabel}>JOIN THE COMMUNITY</Text>
          <Text style={styles.ctaSub}>discord · cohort chat · victor sightings</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40 },
  liveBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
  },
  liveLabel: {
    fontFamily: FONT.bodyBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.accent,
  },
  liveMeta: {
    fontFamily: FONT.body,
    fontSize: 10,
    letterSpacing: 1,
    color: C.inkMuted,
  },
  sectionLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    marginTop: 14,
    marginBottom: 10,
  },
  loading: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: C.inkMuted,
  },
  list: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
  },
  rowYou: {
    backgroundColor: "#FFFFFF",
    borderColor: C.divider,
    borderLeftWidth: 2,
    borderLeftColor: C.accent,
  },
  rowVictor: {
    backgroundColor: C.surfaceAlt,
  },
  rowRank: {
    fontFamily: FONT.monoBold,
    fontSize: 14,
    color: C.inkMuted,
    width: 32,
  },
  rowName: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 14,
    color: C.ink,
  },
  rowMeta: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: C.inkMuted,
    marginTop: 3,
  },
  rowRight: {
    alignItems: "flex-end",
  },
  rowAmount: {
    fontFamily: FONT.monoBold,
    fontSize: 14,
    color: C.ink,
  },
  rowDays: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: C.inkMuted,
    marginTop: 3,
  },
  cta: {
    marginTop: 28,
    paddingVertical: 18,
    paddingHorizontal: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: C.accent,
    alignItems: "center",
  },
  ctaLabel: {
    fontFamily: FONT.bodyBold,
    fontSize: 13,
    letterSpacing: 1.8,
    color: C.accent,
  },
  ctaSub: {
    fontFamily: FONT.body,
    fontSize: 11,
    letterSpacing: 1.2,
    color: C.inkMuted,
    marginTop: 6,
  },
  namePrompt: {
    marginTop: 24,
    padding: 16,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.divider,
  },
  namePromptCta: {
    alignItems: "center",
  },
  namePromptLabel: {
    fontFamily: FONT.bodyBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: C.accent,
  },
  namePromptHint: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: C.inkMuted,
    marginTop: 6,
    textAlign: "center",
  },
  fieldLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    marginBottom: 8,
  },
  input: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 16,
    color: C.ink,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.divider,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  editRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  editBtnGhost: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: C.divider,
    alignItems: "center",
  },
  editBtnGhostLabel: {
    fontFamily: FONT.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: C.inkMuted,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: C.ink,
    borderWidth: 1,
    borderColor: C.ink,
    alignItems: "center",
  },
  editBtnLabel: {
    fontFamily: FONT.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: "#FFFFFF",
  },
});
