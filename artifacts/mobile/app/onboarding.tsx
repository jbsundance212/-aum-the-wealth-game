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
      "Built the Vane-Buckley Trust across five decades, three market crashes, and one inexplicable investment in Portuguese sardine futures that somehow returned 340%. He believed inherited wealth without financial education is merely a countdown to zero. He wrote the curriculum. He is watching. Probably from somewhere with better whisky than you have.",
    ],
    imageUri: characterFace("barnaby", PORTRAIT_SIZE) ?? undefined,
    footer: "His Trust now passes — provisionally — to you.",
  },
  {
    eyebrow: "CHAPTER TWO",
    title: "Arthur Sterling, Esq.",
    body: [
      "Senior Partner at Sterling, Reuter & Associates. Has managed this Trust for thirty years without losing a night's sleep — until you came along. Impeccable suit. Immovable principles. He will credit your Trust when you succeed and write you a very formal, very disapproving letter when you do not. He has many such letters already prepared.",
    ],
    imageUri: characterFace("sterling", PORTRAIT_SIZE) ?? undefined,
    footer: "He will not be charmed. He will not be hurried.",
  },
  {
    eyebrow: "CHAPTER THREE",
    title: "Victor Crane",
    body: [
      "Former proprietary trader. Received an identical Trust from a different branch of the family. Currently ahead of you. Made $47,000 before breakfast this morning and mentioned it twice. Considers this competition a formality. He is wrong — but nobody has told him that yet, and frankly nobody dares.",
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
