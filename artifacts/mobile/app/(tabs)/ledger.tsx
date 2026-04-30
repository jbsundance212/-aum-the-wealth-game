import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { C } from "@/constants/colors";
import { Header } from "@/src/components/Header";
import { fmtMoney, STARTING_BALANCE, useStore } from "@/src/data/store";
import { FONT } from "@/src/theme/typography";

export default function LedgerScreen() {
  const { transactions, trustBalance } = useStore();

  const totals = useMemo(() => {
    let credits = 0;
    let debits = 0;
    for (const t of transactions) {
      if (t.amount >= 0) credits += t.amount;
      else debits += Math.abs(t.amount);
    }
    return { credits, debits };
  }, [transactions]);

  const change = trustBalance - STARTING_BALANCE;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header eyebrow="THE LEDGER" title="Every credit. Every penalty." />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headline}>
          <Text style={styles.headlineLabel}>NET ASSET VALUE</Text>
          <Text style={styles.headlineAmount}>{fmtMoney(trustBalance)}</Text>
          <Text
            style={[
              styles.headlineDelta,
              { color: change >= 0 ? C.positive : C.accent },
            ]}
          >
            {change >= 0 ? "+" : "−"}${Math.abs(change).toLocaleString()} since
            inception
          </Text>
        </View>

        <View style={styles.subRow}>
          <View style={styles.subCell}>
            <Text style={styles.subLabel}>CREDITS</Text>
            <Text style={[styles.subAmount, { color: C.positive }]}>
              +${totals.credits.toLocaleString()}
            </Text>
          </View>
          <View style={styles.subCell}>
            <Text style={styles.subLabel}>PENALTIES</Text>
            <Text style={[styles.subAmount, { color: C.accent }]}>
              −${totals.debits.toLocaleString()}
            </Text>
          </View>
        </View>

        <Text style={styles.section}>TRANSACTION HISTORY</Text>

        {transactions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              The ledger is currently quiet. Begin a Residency Day to record
              entries against the Trust.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {transactions.map((tx) => {
              const positive = tx.amount >= 0;
              const date = new Date(tx.ts);
              const time = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <View key={tx.id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowDay}>
                      D{String(tx.day).padStart(2, "0")}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowDesc} numberOfLines={2}>
                        {tx.description}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {tx.step.toUpperCase()} · {time}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.rowAmount,
                      { color: positive ? C.positive : C.accent },
                    ]}
                  >
                    {fmtMoney(tx.amount, { sign: true })}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 },
  headline: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    padding: 22,
  },
  headlineLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
  },
  headlineAmount: {
    fontFamily: FONT.monoBold,
    fontSize: 38,
    color: C.ink,
    marginTop: 10,
    letterSpacing: -1,
  },
  headlineDelta: {
    fontFamily: FONT.mono,
    fontSize: 13,
    marginTop: 6,
  },
  subRow: { flexDirection: "row", marginTop: 12 },
  subCell: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    padding: 14,
  },
  subLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.6,
    color: C.inkMuted,
  },
  subAmount: {
    fontFamily: FONT.monoBold,
    fontSize: 16,
    marginTop: 4,
  },
  section: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    marginTop: 26,
    marginBottom: 10,
  },
  empty: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    padding: 24,
  },
  emptyText: {
    fontFamily: FONT.body,
    fontSize: 14,
    color: C.inkMuted,
    lineHeight: 20,
    textAlign: "center",
  },
  list: { gap: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    borderTopWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  rowDay: {
    fontFamily: FONT.monoBold,
    fontSize: 12,
    color: C.ink,
    width: 32,
  },
  rowDesc: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: C.ink,
  },
  rowMeta: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: C.inkMuted,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  rowAmount: {
    fontFamily: FONT.monoBold,
    fontSize: 14,
  },
});

// Wire first row's top border by removing the borderTopWidth: 0 on first item.
// (Visually fine without it because of the section heading above.)
