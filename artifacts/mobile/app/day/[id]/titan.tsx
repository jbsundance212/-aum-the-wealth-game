import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { C } from "@/constants/colors";
import { Button } from "@/src/components/Button";
import { CharacterAvatar } from "@/src/components/CharacterAvatar";
import { Header } from "@/src/components/Header";
import { useStore } from "@/src/data/store";
import { STEP_META, titanLabel } from "@/src/data/types";
import { FONT, T } from "@/src/theme/typography";
import { titanFace } from "@/src/utils/cloudinary";

const PORTRAIT_PX = 92;

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

  // Arthur Sterling has no real photograph — on the days he appears as the
  // Titan (Day 14, Day 49), render the house initials avatar instead of the
  // placeholder Cloudinary portrait used for the historical Titans.
  const isSterling = data?.titanName === "Arthur Sterling";

  const portraitUri = useMemo(() => titanFace(day, PORTRAIT_PX), [day]);
  const [imageFailed, setImageFailed] = useState(false);

  // Reset failure state when the portrait URI changes so a previous load
  // error doesn't permanently lock later valid days into the initials fallback.
  useEffect(() => {
    setImageFailed(false);
  }, [portraitUri]);

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
        title={titanLabel(data.titanName)}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bust}>
          {isSterling ? (
            <CharacterAvatar
              name={data.titanName}
              size={PORTRAIT_PX}
              forceInitials
            />
          ) : (
            <View style={styles.portraitFrame}>
              {portraitUri && !imageFailed ? (
                <Image
                  source={{ uri: portraitUri }}
                  style={styles.portrait}
                  contentFit="cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <Text style={styles.initials}>{initials(data.titanName)}</Text>
              )}
            </View>
          )}
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
  portraitFrame: {
    width: PORTRAIT_PX,
    height: PORTRAIT_PX,
    borderRadius: PORTRAIT_PX / 2,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#222",
  },
  portrait: {
    width: PORTRAIT_PX,
    height: PORTRAIT_PX,
    borderRadius: PORTRAIT_PX / 2,
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
