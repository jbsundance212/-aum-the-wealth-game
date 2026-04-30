import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { C } from "@/constants/colors";
import { FONT, T } from "@/src/theme/typography";

const STERLING = require("../../assets/images/sterling.png");

type Props = {
  body: string;
  tone?: "neutral" | "approval" | "rebuke";
  signature?: string;
  compact?: boolean;
};

export function SterlingMessage({
  body,
  tone = "neutral",
  signature = "Arthur Sterling, Esq.",
  compact,
}: Props) {
  const accent =
    tone === "approval" ? C.positive : tone === "rebuke" ? C.accent : C.ink;
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={[styles.bar, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Image source={STERLING} style={styles.avatar} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>CORRESPONDENCE FROM</Text>
            <Text style={styles.name}>Arthur Sterling, Esq.</Text>
            <Text style={styles.role}>Senior Partner · Vane-Buckley Trust</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <Text style={[T.body, styles.text]}>{body.trim()}</Text>
        <Text style={styles.signature}>— {signature}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    marginVertical: 8,
  },
  compact: { marginVertical: 4 },
  bar: { width: 4 },
  body: { flex: 1, padding: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: C.surfaceAlt,
  },
  label: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    textTransform: "uppercase",
  },
  name: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 15,
    color: C.ink,
    marginTop: 2,
  },
  role: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: C.inkMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: C.divider,
    marginVertical: 14,
  },
  text: { color: C.ink },
  signature: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: C.inkMuted,
    fontStyle: "italic",
    marginTop: 14,
  },
});
