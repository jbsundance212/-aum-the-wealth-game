import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { C } from "@/constants/colors";
import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { useStore } from "@/src/data/store";
import { STEP_META } from "@/src/data/types";
import { FONT, T } from "@/src/theme/typography";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TitanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const day = parseInt(String(id || "1"), 10) || 1;
  const router = useRouter();
  const { days, recordStep, isStepDone } = useStore();
  const data = days[day - 1];

  const finish = async () => {
    if (!isStepDone(day, "titan")) {
      await recordStep(day, "titan", {
        reward: STEP_META.titan.reward,
        description: `Day ${day} — Titan studied (${data.titanName})`,
      });
    }
    router.back();
  };

  if (!data) return null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header
        back
        eyebrow={`DAY ${String(day).padStart(2, "0")} · III OF VIII`}
        title="The Titan"
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bust}>
          <View style={styles.portrait}>
            <Text style={styles.initials}>{initials(data.titanName)}</Text>
          </View>
          <Text style={styles.titanName}>{data.titanName}</Text>
          {data.titanTitle ? (
            <Text style={styles.titanTitle}>{data.titanTitle}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BIOGRAPHICAL FILE</Text>
          <Text style={[T.body, { color: C.ink }]}>{data.titanBio}</Text>
        </View>

        {data.titanLesson ? (
          <View style={styles.lessonCard}>
            <Text style={styles.lessonLabel}>KEY LESSON</Text>
            <Text style={styles.lessonBody}>{data.titanLesson}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THE PLAYBOOK</Text>
          <Text style={[T.body, { color: C.ink }]}>{data.titanPlaybook}</Text>
        </View>

        <View style={{ marginTop: 24 }}>
          <Button
            label="Acknowledge the Titan"
            variant="ink"
            onPress={finish}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 60 },
  bust: {
    alignItems: "center",
    paddingVertical: 22,
    backgroundColor: C.ink,
  },
  portrait: {
    width: 92,
    height: 92,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: FONT.bodyBold,
    fontSize: 32,
    letterSpacing: 4,
    color: "#FFFFFF",
  },
  titanName: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 22,
    color: "#FFFFFF",
    marginTop: 14,
  },
  titanTitle: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: "#B5BCC7",
    marginTop: 6,
    paddingHorizontal: 22,
    textAlign: "center",
  },
  section: { marginTop: 22 },
  sectionLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    marginBottom: 8,
  },
  lessonCard: {
    marginTop: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: C.accent,
    borderColor: C.divider,
    padding: 16,
  },
  lessonLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.accent,
  },
  lessonBody: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 16,
    color: C.ink,
    marginTop: 8,
    lineHeight: 24,
  },
});
