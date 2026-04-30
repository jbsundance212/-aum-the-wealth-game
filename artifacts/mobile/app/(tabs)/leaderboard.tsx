import { Image } from "expo-image";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { C } from "@/constants/colors";
import { Header } from "@/src/components/Header";
import { fmtMoney, leaderboard, useStore } from "@/src/data/store";
import { FONT } from "@/src/theme/typography";

const VICTOR = require("../../assets/images/victor.png");

export default function LeaderboardScreen() {
  const { profile, trustBalance, victorBalance } = useStore();
  const rows = useMemo(
    () => leaderboard({ profile, trustBalance, victorBalance }),
    [profile, trustBalance, victorBalance],
  );

  const you = rows.find((r) => r.isYou);
  const victor = rows.find((r) => r.isVictor);
  const lead = (you?.balance || 0) - (victor?.balance || 0);
  const youRank = rows.findIndex((r) => r.isYou) + 1;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header
        eyebrow="THE TRUSTEES"
        title="Standings of the Vane-Buckley Cohort"
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.duel}>
          <View style={[styles.duelCol, styles.duelColLeft]}>
            <Text style={styles.duelLabel}>YOU · #{youRank}</Text>
            <Text style={styles.duelName} numberOfLines={1}>
              {you?.name}
            </Text>
            <Text style={styles.duelAmount}>{fmtMoney(you?.balance || 0)}</Text>
          </View>
          <View style={styles.duelDivider}>
            <Text style={styles.duelVs}>VS</Text>
            <Text
              style={[
                styles.duelLead,
                { color: lead >= 0 ? C.positive : C.accent },
              ]}
            >
              {lead >= 0 ? "+" : "−"}${Math.abs(lead).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.duelCol, styles.duelColRight]}>
            <Image source={VICTOR} style={styles.duelPortrait} contentFit="cover" />
            <Text style={styles.duelLabel}>VICTOR CRANE</Text>
            <Text style={styles.duelAmount}>
              {fmtMoney(victor?.balance || 0)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>FULL STANDINGS · {rows.length} TRUSTEES</Text>

        <View style={styles.list}>
          {rows.map((r, i) => {
            const highlight = r.isYou ? styles.rowYou : r.isVictor ? styles.rowVictor : null;
            return (
              <View
                key={r.name + i}
                style={[styles.row, highlight, i > 0 && { borderTopWidth: 0 }]}
              >
                <Text
                  style={[
                    styles.rowRank,
                    r.isYou && { color: C.accent },
                  ]}
                >
                  {String(i + 1).padStart(2, "0")}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.rowName,
                      r.isYou && { color: C.accent, fontFamily: FONT.bodyBold },
                    ]}
                  >
                    {r.name}
                    {r.isYou ? "  ←  you" : ""}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {r.isVictor ? "Rival beneficiary" : r.isYou ? "Beneficiary" : "Cohort member"}
                  </Text>
                </View>
                <Text style={styles.rowAmount}>{fmtMoney(r.balance)}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 },
  duel: {
    flexDirection: "row",
    backgroundColor: C.ink,
    paddingVertical: 22,
    alignItems: "center",
  },
  duelCol: { flex: 1, alignItems: "center", paddingHorizontal: 12 },
  duelColLeft: { borderRightWidth: 1, borderRightColor: "#5C6573" },
  duelColRight: {},
  duelPortrait: {
    width: 56,
    height: 56,
    backgroundColor: "#222",
    marginBottom: 8,
  },
  duelLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.6,
    color: "#B5BCC7",
  },
  duelName: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 6,
  },
  duelAmount: {
    fontFamily: FONT.monoBold,
    fontSize: 18,
    color: "#FFFFFF",
    marginTop: 6,
  },
  duelDivider: {
    paddingHorizontal: 14,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#5C6573",
  },
  duelVs: {
    fontFamily: FONT.bodyBold,
    fontSize: 14,
    letterSpacing: 2,
    color: "#FFFFFF",
  },
  duelLead: {
    fontFamily: FONT.monoBold,
    fontSize: 12,
    marginTop: 6,
  },
  sectionLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    marginTop: 26,
    marginBottom: 10,
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
  rowYou: { backgroundColor: "#FFFFFF", borderColor: C.accent },
  rowVictor: { backgroundColor: C.surfaceAlt },
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
  rowAmount: {
    fontFamily: FONT.monoBold,
    fontSize: 14,
    color: C.ink,
  },
});
