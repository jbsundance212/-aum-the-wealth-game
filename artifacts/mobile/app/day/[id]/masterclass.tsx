import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { exitToHub } from "@/src/utils/nav";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { C } from "@/constants/colors";
import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { useStore } from "@/src/data/store";
import { STEP_META } from "@/src/data/types";
import { FONT, T } from "@/src/theme/typography";

let YoutubePlayer: any = null;
if (Platform.OS !== "web") {
  try {
    // Dynamically required to avoid web bundler trying to load native module.
    YoutubePlayer = require("react-native-youtube-iframe").default;
  } catch {
    YoutubePlayer = null;
  }
}

export default function MasterclassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const day = parseInt(String(id || "1"), 10) || 1;
  const router = useRouter();
  const { days, recordStep, isStepDone } = useStore();
  const data = days[day - 1];
  const [acknowledged, setAcknowledged] = useState(isStepDone(day, "masterclass"));

  const finish = async () => {
    if (!isStepDone(day, "masterclass")) {
      await recordStep(day, "masterclass", {
        reward: STEP_META.masterclass.reward,
        description: `Day ${day} — Masterclass viewed`,
      });
    }
    exitToHub(router, day);
  };

  if (!data) return null;
  const width = Dimensions.get("window").width - 36;
  const height = Math.round((width * 9) / 16);
  const embedUrl = data.masterclassYouTubeId
    ? `https://www.youtube.com/embed/${data.masterclassYouTubeId}`
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header
        back
        eyebrow={`DAY ${String(day).padStart(2, "0")} · II OF VIII`}
        title="The Masterclass"
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.player, { height }]}>
          {Platform.OS === "web" ? (
            embedUrl ? (
              <iframe
                src={embedUrl}
                title="The Masterclass"
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <View style={styles.fallback}>
                <Feather name="play-circle" size={56} color={C.inkMuted} />
                <Text style={styles.fallbackText}>Lecture unavailable</Text>
              </View>
            )
          ) : YoutubePlayer && data.masterclassYouTubeId ? (
            <YoutubePlayer
              height={height}
              width={width}
              videoId={data.masterclassYouTubeId}
              play={false}
              onChangeState={(state: string) => {
                if (state === "ended") setAcknowledged(true);
              }}
            />
          ) : (
            <View style={styles.fallback}>
              <Feather name="play-circle" size={56} color={C.inkMuted} />
              <Text style={styles.fallbackText}>Lecture unavailable</Text>
            </View>
          )}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteLabel}>EXECUTOR'S NOTE</Text>
          <Text style={[T.body, styles.noteBody]}>
            Mr Sterling expects close attention to this lecture. The Trust does
            not credit work performed in passing. Watch the masterclass in full
            and signify completion below.
          </Text>
        </View>

        <View style={{ marginTop: 22 }}>
          <Button
            label={
              acknowledged
                ? "Acknowledge Masterclass"
                : "I have viewed the masterclass"
            }
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
  player: {
    backgroundColor: "#000",
    width: "100%",
    overflow: "hidden",
  },
  fallback: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    gap: 8,
  },
  fallbackText: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 14,
    color: C.ink,
  },
  note: {
    marginTop: 22,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    padding: 16,
  },
  noteLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
  },
  noteBody: { marginTop: 8 },
});
