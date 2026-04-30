import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { C } from "@/constants/colors";
import { FONT } from "@/src/theme/typography";

type Variant = "primary" | "outline" | "ghost" | "ink" | "danger";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  full?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  small,
  full = true,
}: Props) {
  const v = STYLES[variant];
  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        v.container,
        small && styles.small,
        full && styles.full,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.label.color as string} />
      ) : (
        <View style={styles.row}>
          <Text style={[styles.label, v.label, small && styles.labelSmall]}>
            {label.toUpperCase()}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  full: { alignSelf: "stretch" },
  small: { paddingVertical: 10, paddingHorizontal: 14 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  labelSmall: { fontSize: 11, letterSpacing: 1.2 },
});

const STYLES: Record<Variant, { container: any; label: any }> = {
  primary: {
    container: { backgroundColor: C.ink, borderColor: C.ink },
    label: { color: "#FFFFFF" },
  },
  outline: {
    container: { backgroundColor: "transparent", borderColor: C.ink },
    label: { color: C.ink },
  },
  ghost: {
    container: { backgroundColor: "transparent", borderColor: "transparent" },
    label: { color: C.ink },
  },
  ink: {
    container: { backgroundColor: C.ink, borderColor: C.ink },
    label: { color: "#FFFFFF" },
  },
  danger: {
    container: { backgroundColor: C.accent, borderColor: C.accent },
    label: { color: "#FFFFFF" },
  },
};
