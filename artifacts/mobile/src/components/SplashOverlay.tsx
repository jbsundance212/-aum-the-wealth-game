import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { C } from "@/constants/colors";
import { BrandMark } from "@/src/components/BrandMark";
import { FONT } from "@/src/theme/typography";

type Props = {
  ready: boolean;
  minDurationMs?: number;
};

export function SplashOverlay({ ready, minDurationMs = 700 }: Props) {
  const [mounted, setMounted] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const startedAt = useRef(Date.now());
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      opacity.stopAnimation();
    };
  }, [opacity]);

  useEffect(() => {
    if (!ready) return;
    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, minDurationMs - elapsed);
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && aliveRef.current) setMounted(false);
      });
    }, remaining);
    return () => clearTimeout(t);
  }, [ready, minDurationMs, opacity]);

  if (!mounted) return null;
  return (
    <Animated.View
      style={[
        styles.wrap,
        { opacity, pointerEvents: ready ? "none" : "auto" },
      ]}
    >
      <BrandMark height={64} />
      <Text style={styles.tag}>THE WEALTH GAME</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    gap: 10,
  },
  tag: {
    fontFamily: FONT.bodyMedium,
    fontSize: 11,
    letterSpacing: 2.4,
    color: C.inkMuted,
    marginTop: 4,
  },
});
