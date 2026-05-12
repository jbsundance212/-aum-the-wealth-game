import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C } from "@/constants/colors";
import { AudioPlayer } from "@/src/components/AudioPlayer";
import { Button } from "@/src/components/Button";
import { CharacterAvatar } from "@/src/components/CharacterAvatar";
import { audioForIntro } from "@/src/data/audioMap";
import { type IntroAudioKey, useStore } from "@/src/data/store";
import { FONT } from "@/src/theme/typography";
import { characterFace } from "@/src/utils/cloudinary";

// Rendered diameter of the chapter portrait. We request 2× this size from
// Cloudinary for retina sharpness.
const AVATAR_DIAMETER = 220;

// "CONTINUE" is unlocked when audio finishes OR after this many ms — whichever
// comes first. Per the audio brief: 10 seconds.
const CONTINUE_UNLOCK_MS = 10_000;

const SKIP_INK = "#888888";

type ContentSlide = {
  kind: "story";
  eyebrow: string;
  title: string;
  body: string[];
  // Avatar configuration: a real character key (renders the avatar component)
  // plus an optional photoUri for characters who have a real photo. When
  // `photoUri` is null, the avatar falls back to initials.
  characterName: string;
  photoUri: string | null;
  footer: string;
  // Cloudinary intro audio — auto-plays, gates "CONTINUE" on completion.
  introKey: IntroAudioKey;
};

type NameSlide = {
  kind: "name";
  eyebrow: string;
  title: string;
};

type Slide = ContentSlide | NameSlide;

const SLIDES: Slide[] = [
  {
    kind: "story",
    eyebrow: "CHAPTER ONE",
    title: "Barnaby Buckley, 1934 – 2025",
    body: [
      "Built the Vane-Buckley Trust across five decades, three market crashes, and one inexplicable investment in Portuguese sardine futures that somehow returned 340%. A man who once shorted the pound sterling from a payphone in Geneva and made enough to buy a small island — which he then chose not to buy, because, as he put it, islands are illiquid and impossible to rebalance. He believed inherited wealth without financial education is merely a countdown to zero. He wrote the curriculum. He is watching. Probably from somewhere with better whisky than you have.",
    ],
    characterName: "Barnaby Buckley",
    photoUri: characterFace("barnaby", AVATAR_DIAMETER),
    footer: "His Trust now passes — provisionally — to you.",
    introKey: "barnaby",
  },
  {
    kind: "story",
    eyebrow: "CHAPTER TWO",
    title: "Arthur Sterling, Esq.",
    body: [
      "Senior Partner at Sterling, Reuter & Associates. Has managed this Trust for thirty years without losing a night's sleep — until you came along. Impeccable suit. Immovable principles. He will credit your Trust when you succeed and write you a very formal, very disapproving letter when you do not. He has many such letters already prepared.",
    ],
    characterName: "Arthur Sterling",
    photoUri: characterFace("sterling", AVATAR_DIAMETER),
    footer: "He will not be charmed. He will not be hurried.",
    introKey: "sterling",
  },
  {
    kind: "story",
    eyebrow: "CHAPTER THREE",
    title: "Victor Crane",
    body: [
      "Former proprietary trader. Received an identical Trust from a different branch of the family. Currently ahead of you. Made $47,000 before breakfast this morning and mentioned it twice. Considers this competition a formality. He is wrong — but nobody has told him that yet, and frankly nobody dares.",
    ],
    characterName: "Victor Crane",
    photoUri: characterFace("victor", AVATAR_DIAMETER),
    footer: "You begin together at $1,000,000. The work begins tomorrow.",
    introKey: "crane",
  },
  {
    kind: "name",
    eyebrow: "FOR THE TRUSTEE LEDGER",
    title: "Sterling requires your name.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const {
    displayName,
    setDisplayName,
    completeOnboarding,
    markIntroListened,
    hasListenedIntro,
  } = useStore();
  const [nameInput, setNameInput] = useState(displayName);
  // Per-step "continue unlocked" gate for character chapters. Resets when
  // `step` changes; flips true on either audio completion or the 10s timer.
  const [continueUnlocked, setContinueUnlocked] = useState(false);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slide = SLIDES[step]!;
  const isLast = step === SLIDES.length - 1;
  const isStory = slide.kind === "story";
  const nameValid = nameInput.trim().length >= 2;

  // (Re)arm the 10-second unlock fallback whenever we land on a story slide.
  // If the player has already listened to this intro on a prior visit (or in
  // a previous app session), unlock immediately — no penalty for revisiting.
  useEffect(() => {
    if (unlockTimer.current) {
      clearTimeout(unlockTimer.current);
      unlockTimer.current = null;
    }
    if (!isStory) {
      setContinueUnlocked(true);
      return;
    }
    const storySlide = slide as ContentSlide;
    if (hasListenedIntro(storySlide.introKey)) {
      setContinueUnlocked(true);
      return;
    }
    setContinueUnlocked(false);
    unlockTimer.current = setTimeout(() => {
      setContinueUnlocked(true);
    }, CONTINUE_UNLOCK_MS);
    return () => {
      if (unlockTimer.current) {
        clearTimeout(unlockTimer.current);
        unlockTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const next = async () => {
    if (isLast) {
      if (!nameValid) return;
      await setDisplayName(nameInput);
      await completeOnboarding();
      router.replace("/(tabs)");
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => {
    // Skip remaining intros — jump to the name-entry slide. Audio cleanup
    // happens via the AudioPlayer's unmount effect.
    setStep(SLIDES.length - 1);
  };

  const continueDisabled =
    (isStory && !continueUnlocked) || (isLast && !nameValid);

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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Text style={styles.title}>{slide.title}</Text>

        {isStory ? (
          <>
            <View style={styles.imageWrap}>
              <CharacterAvatar
                name={(slide as ContentSlide).characterName}
                size={AVATAR_DIAMETER}
                photoUri={(slide as ContentSlide).photoUri}
              />
            </View>

            <AudioPlayer
              key={`intro-${(slide as ContentSlide).introKey}`}
              uri={audioForIntro((slide as ContentSlide).introKey)}
              autoPlay
              style={styles.introPlayer}
              onComplete={() => {
                setContinueUnlocked(true);
                void markIntroListened((slide as ContentSlide).introKey);
              }}
              onError={() => {
                // Audio missing or failed to load — don't punish the player
                // with a 10-second wait; unlock CONTINUE immediately.
                setContinueUnlocked(true);
              }}
            />

            {(slide as ContentSlide).body.map((p, i) => (
              <Text key={i} style={styles.copy}>
                {p}
              </Text>
            ))}
            <Text style={styles.footer}>{(slide as ContentSlide).footer}</Text>
          </>
        ) : (
          <View style={styles.nameWrap}>
            <Text style={styles.copy}>
              Enter the name that will appear on the cohort leaderboard and in
              the trustee ledger. Two characters minimum. No emojis. Sterling
              would prefer your full Christian name, but he will accept what he
              is given.
            </Text>
            <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. Margaret Vane-Buckley"
              placeholderTextColor={C.inkMuted}
              maxLength={60}
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (nameValid) void next();
              }}
            />
            <Text style={styles.fieldHint}>
              {nameValid
                ? "Recorded. Sterling approves (silently)."
                : "At least 2 characters."}
            </Text>
          </View>
        )}
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
            disabled={continueDisabled}
          />
        </View>
      </View>
      {/* Skip — only visible during character chapters, bottom-right. */}
      {isStory && !isLast ? (
        <Pressable
          onPress={skip}
          accessibilityRole="button"
          accessibilityLabel="Skip character introductions"
          style={styles.skipBtn}
          hitSlop={10}
        >
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>
      ) : null}
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
  introPlayer: {
    marginTop: 18,
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
  nameWrap: { marginTop: 4 },
  fieldLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.inkMuted,
    marginTop: 28,
    marginBottom: 8,
  },
  input: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 18,
    color: C.ink,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.divider,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  fieldHint: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: C.inkMuted,
    marginTop: 8,
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
  skipBtn: {
    position: "absolute",
    right: 18,
    bottom: 70,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipText: {
    fontFamily: FONT.mono,
    fontSize: 9,
    color: SKIP_INK,
    letterSpacing: 3,
  },
});
