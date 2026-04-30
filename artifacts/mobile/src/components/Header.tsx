import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C } from "@/constants/colors";
import { BrandMark } from "@/src/components/BrandMark";
import { FONT } from "@/src/theme/typography";
import { fmtMoney, useStore } from "@/src/data/store";

type Props = {
  title?: string;
  eyebrow?: string;
  back?: boolean;
  showBalance?: boolean;
};

export function Header({ title, eyebrow, back, showBalance = true }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { trustBalance } = useStore();

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + 12 },
      ]}
    >
      <View style={styles.row}>
        {back ? (
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
            <Feather name="chevron-left" size={22} color={C.ink} />
            <Text style={styles.backText}>BACK</Text>
          </Pressable>
        ) : (
          <View style={styles.brand}>
            <BrandMark height={22} />
            <View style={styles.brandRule} />
            <Text style={styles.brandTag}>VANE-BUCKLEY TRUST</Text>
          </View>
        )}
        {showBalance ? (
          <View style={styles.balance}>
            <Text style={styles.balanceLabel}>NAV</Text>
            <Text style={styles.balanceAmount}>{fmtMoney(trustBalance)}</Text>
          </View>
        ) : null}
      </View>
      {(eyebrow || title) && (
        <View style={styles.titleBlock}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
        </View>
      )}
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: C.bg,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: {
    fontFamily: FONT.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.6,
    color: C.ink,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandRule: { width: 1, height: 18, backgroundColor: C.ink },
  brandTag: {
    fontFamily: FONT.bodyMedium,
    fontSize: 9.5,
    letterSpacing: 1.4,
    color: C.inkMuted,
  },
  balance: { alignItems: "flex-end" },
  balanceLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.6,
    color: C.inkMuted,
  },
  balanceAmount: {
    fontFamily: FONT.monoBold,
    fontSize: 16,
    color: C.ink,
    marginTop: 2,
    ...Platform.select({ web: { fontVariant: ["tabular-nums" as any] } }),
  },
  titleBlock: { marginTop: 14 },
  eyebrow: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.accent,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 22,
    color: C.ink,
    marginTop: 6,
    letterSpacing: -0.2,
  },
  rule: {
    height: 1,
    backgroundColor: C.divider,
    marginTop: 14,
  },
});
