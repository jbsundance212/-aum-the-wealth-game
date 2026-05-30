import { useLocalSearchParams, useRouter } from "expo-router";
import { exitToHub } from "@/src/utils/nav";
import React from "react";
import { View } from "react-native";

import { C } from "@/constants/colors";
import { Header } from "@/src/components/Header";
import {
  NarrativeRunner,
  QuestionRunner,
} from "@/src/components/QuestionRunner";
import { useStore } from "@/src/data/store";
import { STEP_META } from "@/src/data/types";

export default function MomentumScreen() {
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
        eyebrow={`DAY ${String(day).padStart(2, "0")} · VI OF VIII`}
        title="The Momentum Signal"
      />
      {data.momentum.hasQuiz ? (
        <QuestionRunner
          data={data.momentum}
          step="momentum"
          rewardCorrect={STEP_META.momentum.reward}
          rewardWrong={-20_000}
          onContinue={async ({ correct }) => {
            if (!isStepDone(day, "momentum")) {
              await recordStep(day, "momentum", {
                correct,
                reward: correct ? STEP_META.momentum.reward : -20_000,
                description: correct
                  ? `Day ${day} — Momentum signal read correctly`
                  : `Day ${day} — Momentum signal misread`,
              });
            }
            exitToHub(router, day);
          }}
        />
      ) : (
        <NarrativeRunner
          rawText={data.momentum.rawText}
          reward={STEP_META.momentum.reward}
          onContinue={async () => {
            if (!isStepDone(day, "momentum")) {
              await recordStep(day, "momentum", {
                correct: true,
                reward: STEP_META.momentum.reward,
                description: `Day ${day} — Momentum signal acknowledged`,
              });
            }
            exitToHub(router, day);
          }}
        />
      )}
    </View>
  );
}
