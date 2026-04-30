import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C } from "@/constants/colors";
import { FONT } from "@/src/theme/typography";
import { fmtMoney, useStore } from "@/src/data/store";

export function TransactionToast() {
  const { toast, dismissToast } = useStore();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: -12,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [toast, opacity, translate]);

  if (!toast) return null;
  const positive = toast.amount >= 0;
  const top = (insets.top || (Platform.OS === "android" ? 24 : 0)) + 8;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { top, opacity, transform: [{ translateY: translate }] },
      ]}
    >
      <Pressable onPress={dismissToast} style={styles.card}>
        <View style={[styles.bar, { backgroundColor: positive ? C.positive : C.accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>LEDGER ENTRY</Text>
          <View style={styles.row}>
            <Text
              style={[
                styles.amount,
                { color: positive ? C.positive : C.accent },
              ]}
            >
              {fmtMoney(toast.amount, { sign: true })}
            </Text>
          </View>
          <Text style={styles.desc} numberOfLines={2}>
            {toast.description}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 1000,
  },
  card: {
    flexDirection: "row",
    backgroundColor: C.ink,
    borderWidth: 1,
    borderColor: C.ink,
    paddingRight: 14,
  },
  bar: { width: 4, alignSelf: "stretch", marginRight: 12 },
  row: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  label: {
    fontFamily: FONT.bodyMedium,
    fontSize: 9,
    color: "#C9CFD8",
    letterSpacing: 1.6,
    paddingTop: 10,
  },
  amount: {
    fontFamily: FONT.monoBold,
    fontSize: 22,
    paddingVertical: 4,
  },
  desc: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: "#E7EAEF",
    paddingBottom: 12,
  },
});
