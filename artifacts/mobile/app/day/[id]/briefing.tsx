import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { C } from "@/constants/colors";
import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { useStore } from "@/src/data/store";
import { STEP_META } from "@/src/data/types";
import { FONT, T } from "@/src/theme/typography";

const ROMAN = ["I", "II", "III"];

export default function BriefingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const day = parseInt(String(id || "1"), 10) || 1;
  const router = useRouter();
  const { days, recordStep, isStepDone } = useStore();
  const data = days[day - 1];
  const [slide, setSlide] = useState(0);
  const last = slide === 2;

  const finish = async () => {
    if (!isStepDone(day, "briefing")) {
      await recordStep(day, "briefing", {
        reward: STEP_META.briefing.reward,
        description: `Day ${day} — Briefing studied`,
      });
    }
    router.back();
  };

  if (!data) return null;
  const text = data.briefing[slide] || "";
  // Strip leading slide title line if present (e.g. "SLIDE I — TITLE")
  const lines = text.split(/\n/);
  let title = "";
  let body = text;
  if (/^SLIDE [IVX]+/i.test(lines[0] || "")) {
    title = lines[0].trim();
    body = lines.slice(1).join("\n").trim();
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header
        back
        eyebrow={`DAY ${String(day).padStart(2, "0")} · I OF VIII`}
        title="The Briefing"
      />
      <View style={styles.slidePager}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.slidePagerCell,
              { backgroundColor: i <= slide ? C.ink : C.divider },
            ]}
          />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.slideLabel}>SLIDE {ROMAN[slide]} OF III</Text>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={[T.bodyLarge, styles.body]}>{body}</Text>
      </ScrollView>
      <View style={styles.actions}>
        {slide > 0 ? (
          <View style={{ flex: 1, marginRight: 10 }}>
            <Button
              label="Previous"
              variant="outline"
              onPress={() => setSlide((s) => s - 1)}
            />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Button
            label={last ? "Acknowledge Briefing" : "Continue"}
            onPress={() => (last ? finish() : setSlide((s) => s + 1))}
            variant="ink"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slidePager: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingTop: 4,
    gap: 6,
  },
  slidePagerCell: { flex: 1, height: 2 },
  content: { padding: 18, paddingBottom: 60 },
  slideLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.accent,
    marginTop: 6,
  },
  title: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 20,
    color: C.ink,
    marginTop: 10,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  body: { marginTop: 16, color: C.ink },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
});
