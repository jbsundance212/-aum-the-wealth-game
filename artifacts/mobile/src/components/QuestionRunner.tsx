import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { C } from "@/constants/colors";
import { FONT, T } from "@/src/theme/typography";
import { QuestionBlock, StepKey } from "@/src/data/types";

import { Button } from "./Button";
import { SterlingMessage } from "./SterlingMessage";

type Result = { correct: boolean; choice: "A" | "B" | "C" | "D" };

type Props = {
  data: QuestionBlock;
  step: StepKey;
  onContinue: (result: Result) => void;
  rewardCorrect: number;
  rewardWrong: number;
  fallbackCorrect?: string;
  fallbackWrong?: string;
};

const LABELS = ["A", "B", "C", "D"] as const;

export function QuestionRunner({
  data,
  onContinue,
  rewardCorrect,
  rewardWrong,
  fallbackCorrect,
  fallbackWrong,
}: Props) {
  const [choice, setChoice] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const correct = data.correct;
  const isCorrect = submitted && choice === correct;

  const submit = () => {
    if (!choice) return;
    setSubmitted(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        choice === correct
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
  };

  const sterlingBody = isCorrect
    ? data.sterlingCorrect || fallbackCorrect || "The Trust acknowledges the correct answer."
    : data.sterlingWrong ||
      fallbackWrong ||
      "An incorrect response. The correct answer is " + (correct || "—") + ".";

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {data.scenario ? (
        <View style={styles.scenarioCard}>
          <Text style={styles.scenarioLabel}>SCENARIO</Text>
          <Text style={styles.scenarioBody}>{data.scenario}</Text>
        </View>
      ) : null}

      {data.question ? (
        <Text style={[T.body, styles.question]}>{data.question}</Text>
      ) : null}

      <View style={styles.options}>
        {LABELS.filter((l) => data.options[l]).map((l) => {
          const selected = choice === l;
          const showCorrect = submitted && l === correct;
          const showWrong = submitted && selected && l !== correct;
          return (
            <Pressable
              key={l}
              disabled={submitted}
              onPress={() => setChoice(l)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                showCorrect && styles.optionCorrect,
                showWrong && styles.optionWrong,
                pressed && !submitted && { opacity: 0.85 },
              ]}
            >
              <View style={styles.letterCell}>
                <Text
                  style={[
                    styles.letter,
                    selected && { color: "#FFFFFF" },
                    showCorrect && { color: "#FFFFFF" },
                    showWrong && { color: "#FFFFFF" },
                  ]}
                >
                  {l}
                </Text>
              </View>
              <Text style={styles.optionText}>{data.options[l]}</Text>
            </Pressable>
          );
        })}
      </View>

      {!submitted ? (
        <View style={{ marginTop: 18 }}>
          <Button
            label="Submit Answer"
            onPress={submit}
            disabled={!choice}
            variant="ink"
          />
        </View>
      ) : (
        <View style={{ marginTop: 18 }}>
          <View style={styles.verdict}>
            <Text style={styles.verdictLabel}>VERDICT</Text>
            <Text
              style={[
                styles.verdictAmount,
                { color: isCorrect ? C.positive : C.accent },
              ]}
            >
              {isCorrect
                ? "+$" + rewardCorrect.toLocaleString()
                : "−$" + Math.abs(rewardWrong).toLocaleString()}
            </Text>
            <Text style={styles.verdictMeta}>
              {isCorrect
                ? "Correct — credit posted to the Trust ledger."
                : "Incorrect — penalty posted to the Trust ledger."}
            </Text>
          </View>
          <SterlingMessage
            body={sterlingBody}
            tone={isCorrect ? "approval" : "rebuke"}
          />
          <Button
            label="Acknowledge & Continue"
            onPress={() =>
              onContinue({
                correct: isCorrect,
                choice: choice as "A" | "B" | "C" | "D",
              })
            }
            variant="primary"
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 80 },
  scenarioCard: {
    backgroundColor: C.cream,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.divider,
    padding: 16,
    marginBottom: 20,
  },
  scenarioLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.accent,
    marginBottom: 8,
  },
  scenarioBody: {
    fontFamily: FONT.body,
    fontSize: 14,
    lineHeight: 22,
    color: C.ink,
  },
  question: {
    fontSize: 16,
    lineHeight: 25,
    color: C.ink,
    marginBottom: 18,
  },
  options: { gap: 10 },
  option: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    gap: 12,
  },
  optionSelected: { borderColor: C.ink, backgroundColor: C.ink },
  optionCorrect: { borderColor: C.positive, backgroundColor: C.positive },
  optionWrong: { borderColor: C.accent, backgroundColor: C.accent },
  letterCell: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    fontFamily: FONT.monoBold,
    fontSize: 13,
    color: C.ink,
  },
  optionText: {
    flex: 1,
    fontFamily: FONT.body,
    fontSize: 14,
    lineHeight: 21,
    color: C.ink,
    paddingTop: 4,
  },
  verdict: {
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.divider,
    padding: 18,
    marginBottom: 12,
  },
  verdictLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
  },
  verdictAmount: {
    fontFamily: FONT.monoBold,
    fontSize: 28,
    marginTop: 6,
  },
  verdictMeta: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: C.inkSoft,
    marginTop: 6,
  },
});

QuestionRunner.styles = styles;

// When the question block is narrative-only (later Momentum days),
// render a read-only narrative view that yields a positive credit on continue.
type NarrativeProps = {
  rawText: string;
  reward: number;
  onContinue: () => void;
};

export function NarrativeRunner({ rawText, reward, onContinue }: NarrativeProps) {
  const [acked, setAcked] = useState(false);
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[T.body, { lineHeight: 24, marginBottom: 18 }]}>
        {rawText.trim()}
      </Text>
      {!acked ? (
        <Button
          label="Acknowledge Signal"
          variant="ink"
          onPress={() => {
            setAcked(true);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => {});
            }
          }}
        />
      ) : (
        <View>
          <View style={styles.verdict}>
            <Text style={styles.verdictLabel}>SIGNAL ACKNOWLEDGED</Text>
            <Text style={[styles.verdictAmount, { color: C.positive }]}>
              +${reward.toLocaleString()}
            </Text>
            <Text style={styles.verdictMeta}>
              The Trust acknowledges your reading of the signal. Credit posted.
            </Text>
          </View>
          <Button label="Continue" onPress={onContinue} variant="primary" />
        </View>
      )}
    </ScrollView>
  );
}
