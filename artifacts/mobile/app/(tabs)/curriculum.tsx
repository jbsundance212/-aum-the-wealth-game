import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { C } from "@/constants/colors";
import { Header } from "@/src/components/Header";
import { useStore } from "@/src/data/store";
import { FONT } from "@/src/theme/typography";

export default function CurriculumScreen() {
  const router = useRouter();
  const { days, currentDay, isDayComplete } = useStore();

  const grouped = useMemo(() => {
    const map: Record<string, typeof days> = {};
    for (const d of days) {
      if (!map[d.pillar]) map[d.pillar] = [];
      map[d.pillar].push(d);
    }
    return map;
  }, [days]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header eyebrow="THE RESIDENCY" title="49 days. 6 pillars." />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(([pillar, items]) => (
          <View key={pillar} style={styles.pillarBlock}>
            <View style={styles.pillarHeader}>
              <Text style={styles.pillarLabel}>{pillar.toUpperCase()}</Text>
              <Text style={styles.pillarCount}>
                {items.length.toString().padStart(2, "0")} DAYS
              </Text>
            </View>
            <View style={styles.grid}>
              {items.map((d) => {
                const done = isDayComplete(d.dayNumber);
                const locked = d.dayNumber > currentDay;
                const isCurrent = d.dayNumber === currentDay;
                return (
                  <Pressable
                    key={d.dayNumber}
                    disabled={locked && !isCurrent}
                    onPress={() => router.push(`/day/${d.dayNumber}` as any)}
                    style={({ pressed }) => [
                      styles.cell,
                      done && styles.cellDone,
                      isCurrent && styles.cellCurrent,
                      locked && !isCurrent && styles.cellLocked,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellNum,
                        done && { color: "#FFFFFF" },
                        isCurrent && { color: C.accent },
                        locked && !isCurrent && { color: C.inkMuted },
                      ]}
                    >
                      D{String(d.dayNumber).padStart(2, "0")}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.cellTopic,
                        done && { color: "#E5E7EB" },
                        locked && !isCurrent && { color: C.inkMuted },
                      ]}
                    >
                      {d.topic}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 },
  pillarBlock: { marginBottom: 26 },
  pillarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    marginBottom: 10,
  },
  pillarLabel: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: C.ink,
  },
  pillarCount: {
    fontFamily: FONT.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.inkMuted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: {
    width: "31.5%",
    minHeight: 84,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    padding: 10,
    justifyContent: "space-between",
  },
  cellCurrent: {
    borderColor: C.accent,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
  },
  cellDone: { backgroundColor: C.ink, borderColor: C.ink },
  cellLocked: { backgroundColor: C.surfaceAlt },
  cellNum: {
    fontFamily: FONT.monoBold,
    fontSize: 13,
    color: C.ink,
    letterSpacing: 1,
  },
  cellTopic: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: C.inkSoft,
    lineHeight: 14,
    marginTop: 6,
  },
});
