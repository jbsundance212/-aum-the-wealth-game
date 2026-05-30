import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { exitToHub } from "@/src/utils/nav";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  Dimensions,
  Linking,
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

  const openExternally = () => {
    if (Platform.OS === "web") {
      Linking.openURL(data.masterclassUrl);
    } else {
      WebBrowser.openBrowserAsync(data.masterclassUrl).catch(() => {});
    }
  };

  if (!data) return null;
  const width = Dimensions.get("window").width - 36;
  const height = Math.round((width * 9) / 16);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header
        back
        eyebrow={`DAY ${String(day).padStart(2, "0")} · II OF VIII`}
        title="The Masterclass"
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.player, { height }]}>
          {YoutubePlayer && data.masterclassYouTubeId ? (
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
              <Text style={styles.fallbackText}>
                Open the lecture in your browser
              </Text>
              <Text style={styles.fallbackHint}>
                {data.masterclassUrl}
              </Text>
            </View>
          )}
        </View>

        {Platform.OS === "web" || !YoutubePlayer ? (
          <View style={{ marginTop: 14 }}>
            <Button
              label="Open Masterclass in Browser"
              variant="outline"
              onPress={openExternally}
            />
          </View>
        ) : null}

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
  fallbackHint: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: C.inkMuted,
    textAlign: "center",
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
