import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C } from "@/constants/colors";
import { Button } from "@/src/components/Button";
import { useStore } from "@/src/data/store";
import { FONT } from "@/src/theme/typography";
import { characterFace } from "@/src/utils/cloudinary";

const PORTRAIT_SIZE = 320;

const SLIDES: {
  eyebrow: string;
  title: string;
  body: string[];
  imageUri: string | undefined;
  footer: string;
}[] = [
  {
    eyebrow: "CHAPTER ONE",
    title: "Barnaby Buckley, 1934 – 2025",
    body: [
      "Your great-uncle on your mother's side. Late of Zürich, Hong Kong, and the Cap d'Antibes. Barnaby compounded a single inheritance into the Vane-Buckley Trust over the better part of seven decades.",
      "He believed that competence with capital is a duty, not an accident of birth. He left no instruction more frequently than this: 'Inflation is the only tax that doesn't require a vote.'",
    ],
    imageUri: characterFace("barnaby", PORTRAIT_SIZE) ?? undefined,
    footer: "His Trust now passes — provisionally — to you.",
  },
  {
    eyebrow: "CHAPTER TWO",
    title: "Arthur Sterling, Esq.",
    body: [
      "Senior Partner of Sterling, Crispin & Vellacott — the Geneva firm that has served the Buckley family for three generations. Mr Sterling is the executor of the estate and the sole arbiter of the Mandate.",
      "He will speak to you each evening through the Memorandum. He records every credit and every penalty against your name with the same deliberation. Address him with the respect his post demands.",
    ],
    imageUri: characterFace("sterling", PORTRAIT_SIZE) ?? undefined,
    footer: "He will not be charmed. He will not be hurried.",
  },
  {
    eyebrow: "CHAPTER THREE",
    title: "Victor Crane",
    body: [
      "The other beneficiary. A New York proprietary trader, formerly of a firm whose name need not be repeated in this correspondence. Victor was named in the will at the same hour you were.",
      "Whichever of you ends the forty-nine days with the larger Net Asset Value receives the controlling interest. The other is given a discretionary stipend and a polite letter of dismissal. He is, by all accounts, very good.",
    ],
    imageUri: characterFace("victor", PORTRAIT_SIZE) ?? undefined,
    footer: "You begin together at $1,000,000. The work begins tomorrow.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const { completeOnboarding } = useStore();

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const next = async () => {
    if (isLast) {
      await completeOnboarding();
      router.replace("/(tabs)");
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.progress}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressBar,
              { backgroundColor: i <= step ? C.ink : C.divider },
            ]}
          />
        ))}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: slide.imageUri }}
            style={styles.image}
            contentFit="cover"
          />
        </View>
        {slide.body.map((p, i) => (
          <Text key={i} style={styles.copy}>
            {p}
          </Text>
        ))}
        <Text style={styles.footer}>{slide.footer}</Text>
      </ScrollView>
      <View style={styles.actions}>
        {step > 0 ? (
          <View style={{ flex: 1, marginRight: 10 }}>
            <Button
              label="Back"
              variant="outline"
              onPress={() => setStep((s) => s - 1)}
            />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Button
            label={isLast ? "Begin Day One" : "Continue"}
            onPress={next}
            variant="ink"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  progress: {
    flexDirection: "row",
    paddingHorizontal: 22,
    paddingTop: 18,
    gap: 8,
  },
  progressBar: { flex: 1, height: 2 },
  content: { padding: 22, paddingBottom: 40 },
  eyebrow: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: C.accent,
    marginTop: 16,
  },
  title: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 26,
    color: C.ink,
    marginTop: 10,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  imageWrap: {
    alignItems: "center",
    marginTop: 24,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.surfaceAlt,
  },
  copy: {
    fontFamily: FONT.body,
    fontSize: 15,
    color: C.inkSoft,
    lineHeight: 24,
    marginTop: 16,
  },
  footer: {
    fontFamily: FONT.body,
    fontSize: 14,
    color: C.ink,
    fontStyle: "italic",
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
});
