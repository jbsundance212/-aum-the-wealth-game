import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { C } from "@/constants/colors";
import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { StepRow } from "@/src/components/StepRow";
import { useStore } from "@/src/data/store";
import { STEP_ORDER, titanLabel } from "@/src/data/types";
import { FONT, T } from "@/src/theme/typography";

export default function DayHub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const day = parseInt(String(id || "1"), 10) || 1;
  const router = useRouter();
  const {
    days,
    isStepDone,
    stepResult,
    isDayComplete,
    finalizeDay,
    mandateUnlocked,
    refreshMandateStatus,
    loaded,
  } = useStore();

  const data = days[day - 1];
  const allDone = isDayComplete(day);
  const isLockedDay = day >= 2 && !mandateUnlocked;

  // Always re-check the server when arriving at any locked day so a
  // payment from another tab/device unlocks immediately.
  useEffect(() => {
    if (day >= 2) void refreshMandateStatus();
  }, [day, refreshMandateStatus]);

  // Hard paywall gate for Day 2+. Wait for AsyncStorage hydration so we
  // don't bounce a paid player to the paywall during a cold boot.
  useEffect(() => {
    if (loaded && isLockedDay) {
      router.replace("/paywall" as never);
    }
  }, [loaded, isLockedDay, router]);

  useEffect(() => {
    if (allDone && !isLockedDay) {
      // Mark day complete + post bonus + advance currentDay
      finalizeDay(day);
    }
  }, [allDone, day, finalizeDay, isLockedDay]);

  if (isLockedDay) {
    // Render nothing while the redirect runs — avoids flashing locked
    // station content for a single frame.
    return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  }

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Header back title="Day not found" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header back eyebrow={`DAY ${String(day).padStart(2, "0")} · ${data.pillar.toUpperCase()}`} title={data.topic} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{titanLabel(data.titanName).toUpperCase()}</Text>
            <Text style={styles.summaryValue}>{data.titanName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>BOURSE</Text>
            <Text style={styles.summaryValue}>
              {data.bourseParams?.label || "—"}
            </Text>
          </View>
          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.summaryLabel}>STATUS</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: allDone ? C.positive : C.ink },
              ]}
            >
              {allDone ? "Mandate Day Complete" : "In Progress"}
            </Text>
          </View>
        </View>

        <Text style={styles.section}>THE EIGHT STATIONS</Text>

        <View style={styles.steps}>
          {STEP_ORDER.map((step) => (
            <View key={step} style={{ marginBottom: 8 }}>
              <StepRow
                step={step}
                day={day}
                done={isStepDone(day, step)}
                correct={stepResult(day, step)?.correct}
                titleOverride={
                  step === "titan" ? titanLabel(data.titanName) : undefined
                }
              />
            </View>
          ))}
        </View>

        {allDone ? (
          <View style={styles.complete}>
            <Feather name="check-circle" size={28} color={C.positive} />
            <Text style={[T.h2, { marginTop: 10 }]}>Mandate Day Closed</Text>
            <Text style={[T.bodyMuted, { textAlign: "center", marginTop: 6 }]}>
              The Trust has recorded a $25,000 completion bonus. Day{" "}
              {Math.min(49, day + 1)} is now open for business.
            </Text>
            <View style={{ height: 14 }} />
            <Button
              label={
                day < 49
                  ? day === 1 && !mandateUnlocked
                    ? "Unlock the Mandate"
                    : "Proceed to next day"
                  : "View Mandate Closure"
              }
              onPress={() => {
                if (day >= 49) {
                  router.replace("/end" as any);
                  return;
                }
                // Day 1 → Day 2 needs the unlock; route to paywall otherwise.
                if (day === 1 && !mandateUnlocked) {
                  router.replace("/paywall" as any);
                  return;
                }
                router.replace(`/day/${day + 1}` as any);
              }}
              variant="ink"
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 60 },
  summary: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    paddingHorizontal: 16,
  },
  summaryRow: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    gap: 12,
  },
  summaryLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
  },
  summaryValue: {
    flex: 1,
    textAlign: "right",
    fontFamily: FONT.bodySemiBold,
    fontSize: 13,
    color: C.ink,
  },
  section: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    marginTop: 28,
    marginBottom: 12,
  },
  steps: {},
  complete: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.positive,
    padding: 22,
    alignItems: "center",
    marginTop: 24,
  },
});
