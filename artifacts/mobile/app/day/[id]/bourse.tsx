import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { C } from "@/constants/colors";
import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { SterlingMessage } from "@/src/components/SterlingMessage";
import { fmtMoney, useStore } from "@/src/data/store";
import { BourseAsset, STEP_META } from "@/src/data/types";
import { FONT, T } from "@/src/theme/typography";

const STAKE = 100_000;
const TICKS = 50; // 30s @ 600ms
const TICK_MS = 600;
const STARTING_PRICE = 100;
const BANKRUPTCY_FLOOR = 5; // assets cannot fall below this absolute price (5% of start)

type Phase = "intro" | "allocate" | "running" | "complete";

type Holding = {
  asset: BourseAsset;
  weight: number; // 0..1 of stake at start
  units: number;
  price: number;
  startPrice: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function gauss() {
  // Box-Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export default function BourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const day = parseInt(String(id || "1"), 10) || 1;
  const router = useRouter();
  const { days, recordStep, isStepDone, applyDelta } = useStore();
  const data = days[day - 1];

  const params = data?.bourseParams || null;

  const [phase, setPhase] = useState<Phase>("intro");
  const [allocs, setAllocs] = useState<number[]>(() =>
    params ? params.assets.map(() => 0) : [],
  );
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [tick, setTick] = useState(0);
  const [pnl, setPnl] = useState(0);
  const [finalPnL, setFinalPnL] = useState(0);
  const [won, setWon] = useState<boolean | null>(null);
  const [settling, setSettling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const launchedRef = useRef(false);
  const settledRef = useRef(false);
  const flash = useRef(new Animated.Value(0)).current;

  // Reset when day changes
  useEffect(() => {
    setPhase("intro");
    setAllocs(params ? params.assets.map(() => 0) : []);
    setHoldings([]);
    setTick(0);
    setPnl(0);
    setFinalPnL(0);
    setWon(null);
    setSettling(false);
    launchedRef.current = false;
    settledRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [day, params]);

  const totalAlloc = useMemo(
    () => allocs.reduce((a, b) => a + b, 0),
    [allocs],
  );
  const allocValid = totalAlloc > 99 && totalAlloc < 101;

  const updateAlloc = useCallback((i: number, v: number) => {
    setAllocs((prev) => {
      const next = [...prev];
      next[i] = Math.round(v);
      return next;
    });
  }, []);

  const normalize = useCallback(() => {
    const sum = allocs.reduce((a, b) => a + b, 0);
    if (sum <= 0) return;
    setAllocs(allocs.map((a) => Math.round((a / sum) * 100)));
  }, [allocs]);

  const launch = useCallback(async () => {
    if (!params) return;
    if (launchedRef.current) return; // idempotency: ignore double-tap
    launchedRef.current = true;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
    // Build holdings BEFORE the async debit so a fast revisit can't reset state
    const sum = allocs.reduce((a, b) => a + b, 0) || 1;
    const next: Holding[] = params.assets.map((asset, i) => {
      const weight = allocs[i] / sum;
      const dollars = STAKE * weight;
      const units = dollars / STARTING_PRICE;
      return {
        asset,
        weight,
        units,
        price: STARTING_PRICE,
        startPrice: STARTING_PRICE,
      };
    });
    setHoldings(next);
    setTick(0);
    setPnl(0);
    setPhase("running");
    // Post -$100,000 stake to ledger
    await applyDelta(
      -STAKE,
      `Day ${day} — Bourse stake (${params.label})`,
      day,
      "bourse",
    );
  }, [allocs, applyDelta, day, params]);

  // Tick loop
  useEffect(() => {
    if (phase !== "running" || !params) return;
    intervalRef.current = setInterval(() => {
      setTick((t) => {
        const nextT = t + 1;
        setHoldings((prev) =>
          prev.map((h) => {
            const driftPerTick = h.asset.drift / TICKS;
            const volPerTick = h.asset.volatility / Math.sqrt(TICKS);
            const change = driftPerTick + volPerTick * gauss();
            const nextPrice = clamp(
              h.price * (1 + change),
              BANKRUPTCY_FLOOR,
              h.price * 4,
            );
            return { ...h, price: nextPrice };
          }),
        );
        return nextT;
      });
    }, TICK_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, params]);

  // Compute live PnL whenever holdings change
  useEffect(() => {
    if (phase !== "running") return;
    const portfolio = holdings.reduce((sum, h) => sum + h.units * h.price, 0);
    const next = portfolio - STAKE;
    setPnl(next);
    Animated.sequence([
      Animated.timing(flash, {
        toValue: 1,
        duration: 80,
        useNativeDriver: false,
      }),
      Animated.timing(flash, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [holdings, phase, flash]);

  // End condition
  useEffect(() => {
    if (phase !== "running") return;
    if (tick < TICKS) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const portfolio = holdings.reduce((sum, h) => sum + h.units * h.price, 0);
    const profit = portfolio - STAKE;
    setFinalPnL(profit);
    const winning = profit > (params?.winThreshold || 0);
    setWon(winning);
    setPhase("complete");
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        winning
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
  }, [tick, phase, holdings, params]);

  const finalize = useCallback(async () => {
    if (won === null) return;
    if (settledRef.current) return; // idempotency: ignore double-tap
    settledRef.current = true;
    setSettling(true);
    // Return the gross proceeds back to the ledger.
    const portfolio = holdings.reduce((sum, h) => sum + h.units * h.price, 0);
    await applyDelta(
      portfolio,
      `Day ${day} — Bourse closeout (${won ? "WIN" : "LOSS"})`,
      day,
      "bourse",
    );
    if (!isStepDone(day, "bourse")) {
      await recordStep(day, "bourse", {
        correct: won,
        reward: 0, // P&L already applied via applyDelta
        description: won
          ? `Day ${day} — Bourse stewardship completed`
          : `Day ${day} — Bourse closed at a loss`,
      });
    }
    router.back();
  }, [applyDelta, day, holdings, isStepDone, recordStep, router, won]);

  if (!data) return null;

  if (!params) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Header back eyebrow={`DAY ${day}`} title="The Bourse" />
        <View style={styles.empty}>
          <Text style={[T.bodyMuted, { textAlign: "center" }]}>
            No Bourse environment configured for this day.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header
        back
        eyebrow={`DAY ${String(day).padStart(2, "0")} · VIII OF VIII`}
        title="The Bourse"
        showBalance={phase !== "running"}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {phase === "intro" ? (
          <IntroPhase
            envLabel={params.label}
            description={params.description}
            winCondition={params.winCondition}
            assetCount={params.assets.length}
            onBegin={() => setPhase("allocate")}
          />
        ) : null}

        {phase === "allocate" ? (
          <AllocatePhase
            params={params}
            allocs={allocs}
            totalAlloc={totalAlloc}
            allocValid={allocValid}
            onUpdate={updateAlloc}
            onNormalize={normalize}
            onLaunch={launch}
          />
        ) : null}

        {phase === "running" ? (
          <RunningPhase
            tick={tick}
            pnl={pnl}
            holdings={holdings}
            envLabel={params.label}
            flash={flash}
          />
        ) : null}

        {phase === "complete" ? (
          <CompletePhase
            won={!!won}
            pnl={finalPnL}
            sterling={won ? params.sterlingWin : params.sterlingLoss}
            holdings={holdings}
            settling={settling}
            onContinue={finalize}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function IntroPhase({
  envLabel,
  description,
  winCondition,
  assetCount,
  onBegin,
}: {
  envLabel: string;
  description: string;
  winCondition: string;
  assetCount: number;
  onBegin: () => void;
}) {
  return (
    <View>
      <View style={styles.envCard}>
        <Text style={styles.envEyebrow}>TODAY'S MACRO ENVIRONMENT</Text>
        <Text style={styles.envTitle}>{envLabel}</Text>
        <View style={styles.envRule} />
        <Text style={styles.envBody}>{description}</Text>
      </View>

      <View style={styles.specBlock}>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>STAKE</Text>
          <Text style={styles.specValue}>$100,000</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>DURATION</Text>
          <Text style={styles.specValue}>~30 seconds · 50 ticks</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>INSTRUMENTS</Text>
          <Text style={styles.specValue}>{assetCount} asset classes</Text>
        </View>
        <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.specLabel}>OBJECTIVE</Text>
          <Text style={[styles.specValue, { color: C.accent }]}>
            {winCondition}
          </Text>
        </View>
      </View>

      <SterlingMessage
        body={
          "Pre-trade memorandum: $100,000 will be debited from the Trust upon launch. The portfolio will be marked-to-market for thirty seconds. Whatever proceeds remain at the gun will be returned to the ledger. Allocate with discipline."
        }
      />

      <View style={{ marginTop: 18 }}>
        <Button
          label="Proceed to Allocation"
          variant="ink"
          onPress={onBegin}
        />
      </View>
    </View>
  );
}

function AllocatePhase({
  params,
  allocs,
  totalAlloc,
  allocValid,
  onUpdate,
  onNormalize,
  onLaunch,
}: {
  params: NonNullable<ReturnType<typeof Object.assign>>;
  allocs: number[];
  totalAlloc: number;
  allocValid: boolean;
  onUpdate: (i: number, v: number) => void;
  onNormalize: () => void;
  onLaunch: () => void;
}) {
  return (
    <View>
      <View style={styles.allocHeader}>
        <View>
          <Text style={styles.allocLabel}>TOTAL ALLOCATED</Text>
          <Text
            style={[
              styles.allocTotal,
              { color: allocValid ? C.positive : totalAlloc > 100 ? C.accent : C.ink },
            ]}
          >
            {totalAlloc}%
          </Text>
        </View>
        <Pressable onPress={onNormalize} style={styles.normalize}>
          <Text style={styles.normalizeLabel}>NORMALIZE TO 100%</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 8 }}>
        {params.assets.map((asset: BourseAsset, i: number) => (
          <View key={asset.name} style={styles.assetRow}>
            <View style={styles.assetTop}>
              <Text style={styles.assetName}>{asset.name.toUpperCase()}</Text>
              <Text style={styles.assetWeight}>{allocs[i] || 0}%</Text>
            </View>
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={5}
              value={allocs[i] || 0}
              minimumTrackTintColor={C.ink}
              maximumTrackTintColor={C.divider}
              thumbTintColor={C.accent}
              onValueChange={(v) => onUpdate(i, v)}
            />
          </View>
        ))}
      </View>

      {!allocValid ? (
        <Text style={styles.allocHint}>
          Allocation must total exactly 100%. Normalize or adjust the sliders.
        </Text>
      ) : null}

      <View style={{ marginTop: 18 }}>
        <Button
          label="Launch The Bourse · Stake $100,000"
          disabled={!allocValid}
          variant="danger"
          onPress={onLaunch}
        />
      </View>
    </View>
  );
}

function RunningPhase({
  tick,
  pnl,
  holdings,
  envLabel,
  flash,
}: {
  tick: number;
  pnl: number;
  holdings: Holding[];
  envLabel: string;
  flash: Animated.Value;
}) {
  const positive = pnl >= 0;
  const remaining = Math.max(0, TICKS - tick);
  const seconds = Math.ceil((remaining * TICK_MS) / 1000);
  const portfolio = STAKE + pnl;

  return (
    <View>
      <View style={styles.tickerHeader}>
        <View style={styles.tickerHeaderRow}>
          <Text style={styles.tickerHeaderLabel}>{envLabel.toUpperCase()}</Text>
          <Text style={styles.tickerCountdown}>T-{String(seconds).padStart(2, "0")}s</Text>
        </View>
        <Animated.Text
          style={[
            styles.tickerPnl,
            {
              color: positive ? C.positive : C.accent,
              backgroundColor: flash.interpolate({
                inputRange: [0, 1],
                outputRange: ["transparent", positive ? "#FFEEEE" : "#F5E5E5"],
              }),
            },
          ]}
        >
          {positive ? "+" : "−"}${Math.abs(Math.round(pnl)).toLocaleString()}
        </Animated.Text>
        <Text style={styles.tickerPortfolio}>
          NAV {fmtMoney(Math.round(portfolio))}  ·  TICK{" "}
          {String(tick).padStart(2, "0")}/{TICKS}
        </Text>
        <View style={styles.progressOuter}>
          <View
            style={[
              styles.progressInner,
              { width: `${Math.round((tick / TICKS) * 100)}%` },
            ]}
          />
        </View>
      </View>

      <Text style={styles.tickerSection}>LIVE TAPE</Text>

      <View>
        {holdings.map((h, i) => {
          const change = h.price / h.startPrice - 1;
          const value = h.units * h.price;
          const positiveAsset = change >= 0;
          return (
            <View key={h.asset.name + i} style={styles.tickerRow}>
              <View style={styles.tickerLeft}>
                <Text style={styles.tickerName}>
                  {h.asset.label || h.asset.name}
                </Text>
                <Text style={styles.tickerCode}>
                  {h.asset.name.toUpperCase()} · {Math.round(h.weight * 100)}%
                </Text>
              </View>
              <View style={styles.tickerRight}>
                <Text style={styles.tickerPrice}>{h.price.toFixed(2)}</Text>
                <Text
                  style={[
                    styles.tickerChange,
                    { color: positiveAsset ? C.positive : C.accent },
                  ]}
                >
                  {positiveAsset ? "+" : "−"}
                  {Math.abs(change * 100).toFixed(1)}%
                </Text>
                <Text style={styles.tickerValue}>
                  {fmtMoney(Math.round(value))}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function CompletePhase({
  won,
  pnl,
  sterling,
  holdings,
  settling,
  onContinue,
}: {
  won: boolean;
  pnl: number;
  sterling: string;
  holdings: Holding[];
  settling: boolean;
  onContinue: () => void;
}) {
  const portfolio = STAKE + pnl;
  return (
    <View>
      <View
        style={[
          styles.verdictCard,
          { borderColor: won ? C.positive : C.accent },
        ]}
      >
        <Text style={styles.verdictLabel}>BOURSE CLOSED</Text>
        <Text
          style={[
            styles.verdictHeadline,
            { color: won ? C.positive : C.accent },
          ]}
        >
          {won ? "STEWARDSHIP" : "DRAWDOWN"}
        </Text>
        <Text style={styles.verdictAmount}>
          {pnl >= 0 ? "+" : "−"}${Math.abs(Math.round(pnl)).toLocaleString()}
        </Text>
        <Text style={styles.verdictMeta}>
          Closeout NAV {fmtMoney(Math.round(portfolio))} returned to the Trust.
        </Text>
      </View>

      <Text style={styles.summaryLabel}>FINAL POSITIONS</Text>
      <View>
        {holdings.map((h, i) => {
          const change = h.price / h.startPrice - 1;
          const value = h.units * h.price;
          return (
            <View key={h.asset.name + i} style={styles.finalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tickerName}>
                  {h.asset.label || h.asset.name}
                </Text>
                <Text style={styles.tickerCode}>
                  {Math.round(h.weight * 100)}% · entry 100.00 · close{" "}
                  {h.price.toFixed(2)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={[
                    styles.tickerChange,
                    { color: change >= 0 ? C.positive : C.accent },
                  ]}
                >
                  {change >= 0 ? "+" : "−"}
                  {Math.abs(change * 100).toFixed(1)}%
                </Text>
                <Text style={styles.tickerValue}>
                  {fmtMoney(Math.round(value))}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <SterlingMessage body={sterling} tone={won ? "approval" : "rebuke"} />

      <View style={{ marginTop: 18 }}>
        <Button
          label={settling ? "Settling…" : "Acknowledge & Return Proceeds"}
          variant="ink"
          onPress={onContinue}
          disabled={settling}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 80 },
  empty: { padding: 24 },
  envCard: {
    backgroundColor: C.ink,
    padding: 22,
  },
  envEyebrow: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: "#B5BCC7",
  },
  envTitle: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 22,
    color: "#FFFFFF",
    marginTop: 8,
    letterSpacing: -0.3,
  },
  envRule: {
    height: 1,
    backgroundColor: "#5C6573",
    marginVertical: 14,
  },
  envBody: {
    fontFamily: FONT.body,
    fontSize: 14,
    color: "#E5E7EB",
    lineHeight: 22,
  },
  specBlock: {
    marginTop: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    paddingHorizontal: 14,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    gap: 12,
  },
  specLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
  },
  specValue: {
    flex: 1,
    textAlign: "right",
    fontFamily: FONT.bodySemiBold,
    fontSize: 13,
    color: C.ink,
  },
  allocHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: 6,
  },
  allocLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
  },
  allocTotal: {
    fontFamily: FONT.monoBold,
    fontSize: 38,
    marginTop: 4,
    letterSpacing: -1,
  },
  normalize: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.ink,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  normalizeLabel: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: C.ink,
  },
  assetRow: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    padding: 14,
    marginTop: 10,
  },
  assetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assetName: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 14,
    color: C.ink,
  },
  assetWeight: {
    fontFamily: FONT.monoBold,
    fontSize: 22,
    color: C.ink,
  },
  allocHint: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: C.accent,
    marginTop: 14,
    fontStyle: "italic",
  },
  tickerHeader: {
    backgroundColor: C.surface,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 18,
    borderLeftWidth: 2,
    borderLeftColor: C.accent,
  },
  tickerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tickerHeaderLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.9,
    color: C.accent,
  },
  tickerCountdown: {
    fontFamily: FONT.monoBold,
    fontSize: 11,
    color: C.accent,
    letterSpacing: 1,
  },
  tickerPnl: {
    fontFamily: FONT.monoBold,
    fontSize: 32,
    marginTop: 10,
    letterSpacing: -1,
    paddingHorizontal: 4,
    alignSelf: "flex-start",
  },
  tickerPortfolio: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: C.inkMuted,
    marginTop: 6,
    letterSpacing: 0.4,
  },
  progressOuter: {
    height: 2,
    backgroundColor: C.divider,
    marginTop: 14,
  },
  progressInner: { height: 2, backgroundColor: C.accent },
  tickerSection: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    marginTop: 22,
    marginBottom: 8,
  },
  tickerRow: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  tickerLeft: { flex: 1 },
  tickerRight: { alignItems: "flex-end" },
  tickerName: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 13,
    color: C.ink,
  },
  tickerCode: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: C.inkMuted,
    letterSpacing: 0.6,
    marginTop: 4,
  },
  tickerPrice: {
    fontFamily: FONT.monoBold,
    fontSize: 14,
    color: C.ink,
  },
  tickerChange: {
    fontFamily: FONT.mono,
    fontSize: 12,
    marginTop: 2,
  },
  tickerValue: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: C.inkMuted,
    marginTop: 2,
  },
  verdictCard: {
    backgroundColor: C.surface,
    borderWidth: 2,
    padding: 22,
  },
  verdictLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
  },
  verdictHeadline: {
    fontFamily: FONT.bodyBold,
    fontSize: 20,
    letterSpacing: 3,
    marginTop: 8,
  },
  verdictAmount: {
    fontFamily: FONT.monoBold,
    fontSize: 36,
    color: C.ink,
    marginTop: 10,
    letterSpacing: -1,
  },
  verdictMeta: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: C.inkMuted,
    marginTop: 6,
  },
  summaryLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    marginTop: 22,
    marginBottom: 8,
  },
  finalRow: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "space-between",
  },
});
