import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { C } from "@/constants/colors";
import { Header } from "@/src/components/Header";
import { fmtMoney, useStore } from "@/src/data/store";
import { STEP_ORDER } from "@/src/data/types";
import { FONT, T } from "@/src/theme/typography";

export default function HomeScreen() {
  const router = useRouter();
  const {
    days,
    currentDay,
    profile,
    daysCompleted,
    transactions,
    isStepDone,
    isDayComplete,
    trustBalance,
    victorBalance,
  } = useStore();

  const today = days[currentDay - 1] || days[0];
  const completedSteps = STEP_ORDER.filter((s) => isStepDone(today.dayNumber, s)).length;
  const stepsTotal = STEP_ORDER.length;
  const allDone = isDayComplete(today.dayNumber);
  const recent = transactions.slice(0, 5);
  const lead = trustBalance - (1_000_000 + victorBalance);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header
        eyebrow={"GOOD MORNING · " + (profile?.fullName || "Beneficiary").toUpperCase()}
        title="The Trust is open for business."
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabel}>MANDATE DAY</Text>
            <Text style={styles.kpiValue}>{currentDay} / 49</Text>
          </View>
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabel}>DAYS COMPLETE</Text>
            <Text style={styles.kpiValue}>{daysCompleted.length}</Text>
          </View>
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabel}>vs. CRANE</Text>
            <Text
              style={[
                styles.kpiValue,
                { color: lead >= 0 ? C.positive : C.accent },
              ]}
            >
              {lead >= 0 ? "+" : "−"}${Math.abs(lead).toLocaleString()}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push(`/day/${today.dayNumber}` as any)}
          style={({ pressed }) => [styles.dayCard, pressed && { opacity: 0.92 }]}
        >
          <View style={styles.dayCardTop}>
            <View>
              <Text style={styles.dayPillar}>{today.pillar.toUpperCase()}</Text>
              <Text style={styles.dayTopic}>{today.topic}</Text>
            </View>
            <Text style={styles.dayNumber}>D{String(today.dayNumber).padStart(2, "0")}</Text>
          </View>
          <View style={styles.dayMetaRow}>
            <Text style={styles.dayMeta}>
              {completedSteps} / {stepsTotal} steps complete
            </Text>
            <View style={styles.dayCta}>
              <Text style={styles.dayCtaLabel}>
                {allDone ? "REVIEW" : completedSteps === 0 ? "BEGIN" : "RESUME"}
              </Text>
              <Feather name="arrow-right" size={14} color={C.ink} />
            </View>
          </View>
          <View style={styles.progressOuter}>
            <View
              style={[
                styles.progressInner,
                { width: `${Math.round((completedSteps / stepsTotal) * 100)}%` },
              ]}
            />
          </View>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT LEDGER ACTIVITY</Text>
          <View style={styles.list}>
            {recent.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[T.bodyMuted, { textAlign: "center" }]}>
                  No transactions yet. Begin Day 1 to open the ledger.
                </Text>
              </View>
            ) : (
              recent.map((tx) => {
                const positive = tx.amount >= 0;
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txDesc} numberOfLines={1}>
                        {tx.description}
                      </Text>
                      <Text style={styles.txMeta}>
                        DAY {String(tx.day).padStart(2, "0")} · {tx.step.toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: positive ? C.positive : C.accent },
                      ]}
                    >
                      {fmtMoney(tx.amount, { sign: true })}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerLine}>
            Vane-Buckley Trust · Mandate Cohort{" "}
            {String(profile?.loggedInAt || Date.now()).slice(-4)}
          </Text>
          <Text style={styles.footerLine}>
            Executor in attendance: Arthur Sterling, Esq.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 40, paddingTop: 16 },
  kpiRow: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
  },
  kpiCell: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: C.divider,
  },
  kpiLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    color: C.inkMuted,
  },
  kpiValue: {
    fontFamily: FONT.monoBold,
    fontSize: 18,
    color: C.ink,
    marginTop: 6,
  },
  dayCard: {
    marginTop: 18,
    backgroundColor: C.ink,
    padding: 22,
  },
  dayCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  dayPillar: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: "#B5BCC7",
  },
  dayTopic: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 22,
    color: "#FFFFFF",
    marginTop: 8,
    letterSpacing: -0.2,
    lineHeight: 28,
    paddingRight: 60,
  },
  dayNumber: {
    fontFamily: FONT.monoBold,
    fontSize: 28,
    color: C.accent,
    letterSpacing: -1,
  },
  dayMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
  },
  dayMeta: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: "#B5BCC7",
    letterSpacing: 0.5,
  },
  dayCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  dayCtaLabel: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: C.ink,
  },
  progressOuter: {
    height: 2,
    backgroundColor: "#5C6573",
    marginTop: 18,
  },
  progressInner: { height: 2, backgroundColor: C.accent },
  section: { marginTop: 28 },
  sectionLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    marginBottom: 10,
  },
  list: { gap: 0 },
  empty: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    padding: 24,
    alignItems: "center",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    borderTopWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  txDesc: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: C.ink,
  },
  txMeta: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: C.inkMuted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  txAmount: {
    fontFamily: FONT.monoBold,
    fontSize: 14,
  },
  footerNote: {
    alignItems: "center",
    marginTop: 32,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    gap: 4,
  },
  footerLine: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: C.inkMuted,
    fontStyle: "italic",
  },
});
