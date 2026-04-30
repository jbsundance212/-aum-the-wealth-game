import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { C } from "@/constants/colors";
import { Header } from "@/src/components/Header";
import { QuestionRunner } from "@/src/components/QuestionRunner";
import { useStore } from "@/src/data/store";
import { STEP_META } from "@/src/data/types";

export default function DiagnosticScreen() {
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
        eyebrow={`DAY ${String(day).padStart(2, "0")} · V OF VIII`}
        title="The Diagnostic"
      />
      <QuestionRunner
        data={data.diagnostic}
        step="diagnostic"
        rewardCorrect={STEP_META.diagnostic.reward}
        rewardWrong={-15_000}
        onContinue={async ({ correct }) => {
          if (!isStepDone(day, "diagnostic")) {
            await recordStep(day, "diagnostic", {
              correct,
              reward: correct ? STEP_META.diagnostic.reward : -15_000,
              description: correct
                ? `Day ${day} — Diagnosis correct`
                : `Day ${day} — Diagnosis incorrect`,
            });
          }
          router.back();
        }}
      />
    </View>
  );
}
