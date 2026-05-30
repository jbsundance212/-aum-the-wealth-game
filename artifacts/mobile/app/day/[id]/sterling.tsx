import { useLocalSearchParams, useRouter } from "expo-router";
import { exitToHub } from "@/src/utils/nav";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { C } from "@/constants/colors";
import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { SterlingMessage } from "@/src/components/SterlingMessage";
import { useStore } from "@/src/data/store";
import { STEP_META } from "@/src/data/types";

export default function SterlingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const day = parseInt(String(id || "1"), 10) || 1;
  const router = useRouter();
  const { days, recordStep, isStepDone } = useStore();
  const data = days[day - 1];
  if (!data) return null;

  const finish = async () => {
    if (!isStepDone(day, "sterling")) {
      await recordStep(day, "sterling", {
        reward: STEP_META.sterling.reward,
        description: `Day ${day} — Memorandum acknowledged`,
      });
    }
    exitToHub(router, day);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header
        back
        eyebrow={`DAY ${String(day).padStart(2, "0")} · VII OF VIII`}
        title="The Sterling Memorandum"
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SterlingMessage body={data.sterlingMemo} tone="neutral" />
        <View style={{ marginTop: 18 }}>
          <Button
            label="Acknowledge the Memorandum"
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
});
