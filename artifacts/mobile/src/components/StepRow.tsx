import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { C } from "@/constants/colors";
import { FONT } from "@/src/theme/typography";
import { STEP_META, StepKey } from "@/src/data/types";

type Props = {
  step: StepKey;
  day: number;
  done: boolean;
  correct?: boolean;
};

export function StepRow({ step, day, done, correct }: Props) {
  const router = useRouter();
  const meta = STEP_META[step];
  const sub =
    step === "stress" || step === "diagnostic" || step === "momentum"
      ? "Quiz · ±$" + meta.reward.toLocaleString()
      : step === "bourse"
        ? "Game · $100,000 stake"
        : "Read · +$" + meta.reward.toLocaleString();

  const onPress = () => {
    router.push(`/day/${day}/${step}` as any);
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <View style={styles.numCell}>
        <Text style={styles.num}>{meta.numeral}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.title}>{meta.label}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      <View style={styles.right}>
        {done ? (
          correct === false ? (
            <View style={[styles.dot, { backgroundColor: C.accent }]}>
              <Feather name="x" size={12} color="#fff" />
            </View>
          ) : (
            <View style={[styles.dot, { backgroundColor: C.positive }]}>
              <Feather name="check" size={12} color="#fff" />
            </View>
          )
        ) : (
          <Feather name="chevron-right" size={20} color={C.inkMuted} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 14,
  },
  numCell: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  num: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 13,
    letterSpacing: 1.5,
    color: C.ink,
  },
  middle: { flex: 1 },
  title: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 15,
    color: C.ink,
  },
  sub: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: C.inkMuted,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  right: { width: 28, alignItems: "flex-end" },
  dot: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
