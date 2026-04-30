import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { C } from "@/constants/colors";

type Props = ViewProps & {
  inset?: boolean;
  tone?: "surface" | "alt" | "ink" | "accent";
};

export function Card({ style, inset, tone = "surface", ...rest }: Props) {
  const bg =
    tone === "ink"
      ? C.ink
      : tone === "accent"
        ? C.accent
        : tone === "alt"
          ? C.surfaceAlt
          : C.surface;
  const borderColor = tone === "ink" || tone === "accent" ? bg : C.divider;
  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: bg, borderColor },
        inset && styles.inset,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 18,
  },
  inset: {
    marginHorizontal: 16,
  },
});
