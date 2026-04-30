import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { C } from "@/constants/colors";
import { Header } from "@/src/components/Header";
import { QuestionRunner } from "@/src/components/QuestionRunner";
import { useStore } from "@/src/data/store";
import { STEP_META } from "@/src/data/types";

export default function StressTest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const day = parseInt(String(id || "1"), 10) || 1;
  const router = useRouter();
  const { days, recordStep, isStepDone } = useStore();
  const data = days[day - 1];
  if (!data) return null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header
        back
        eyebrow={`DAY ${String(day).padStart(2, "0")} · IV OF VIII`}
        title="The Stress Test"
      />
      <QuestionRunner
        data={data.stress}
        step="stress"
        rewardCorrect={STEP_META.stress.reward}
        rewardWrong={-25_000}
        onContinue={async ({ correct }) => {
          if (!isStepDone(day, "stress")) {
            await recordStep(day, "stress", {
              correct,
              reward: correct ? STEP_META.stress.reward : -25_000,
              description: correct
                ? `Day ${day} — Stress Test passed`
                : `Day ${day} — Stress Test failed`,
            });
          }
          router.back();
        }}
      />
    </View>
  );
}
