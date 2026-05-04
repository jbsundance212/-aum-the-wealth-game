import { TextStyle } from "react-native";

import { C } from "@/constants/colors";

export const FONT = {
  body: "PublicSans_400Regular",
  bodyMedium: "PublicSans_500Medium",
  bodySemiBold: "PublicSans_600SemiBold",
  bodyBold: "PublicSans_700Bold",
  mono: "JetBrainsMono_400Regular",
  monoBold: "JetBrainsMono_700Bold",
  // Cormorant Garamond — used only on the End-of-Game certificate
  // (`app/end.tsx`). Public Sans / JetBrains Mono remain the rest of
  // the app's voice.
  serif: "CormorantGaramond_400Regular",
  serifItalic: "CormorantGaramond_400Regular_Italic",
  serifSemiBold: "CormorantGaramond_600SemiBold",
} as const;

export const T: Record<string, TextStyle> = {
  display: {
    fontFamily: FONT.bodyBold,
    fontSize: 30,
    lineHeight: 36,
    color: C.ink,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 22,
    lineHeight: 28,
    color: C.ink,
    letterSpacing: -0.2,
  },
  h2: {
    fontFamily: FONT.bodySemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: C.ink,
  },
  body: {
    fontFamily: FONT.body,
    fontSize: 15,
    lineHeight: 23,
    color: C.ink,
  },
  bodyLarge: {
    fontFamily: FONT.body,
    fontSize: 17,
    lineHeight: 27,
    color: C.ink,
  },
  bodyMuted: {
    fontFamily: FONT.body,
    fontSize: 15,
    lineHeight: 22,
    color: C.inkMuted,
  },
  caption: {
    fontFamily: FONT.body,
    fontSize: 13,
    lineHeight: 18,
    color: C.inkMuted,
  },
  label: {
    fontFamily: FONT.bodyMedium,
    fontSize: 11,
    lineHeight: 14,
    color: C.inkMuted,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  monoDisplay: {
    fontFamily: FONT.monoBold,
    fontSize: 26,
    lineHeight: 30,
    color: C.ink,
    letterSpacing: -0.5,
  },
  monoBalance: {
    fontFamily: FONT.monoBold,
    fontSize: 36,
    lineHeight: 40,
    color: C.ink,
    letterSpacing: -1,
  },
  monoBody: {
    fontFamily: FONT.mono,
    fontSize: 14,
    lineHeight: 20,
    color: C.ink,
  },
  monoSmall: {
    fontFamily: FONT.mono,
    fontSize: 12,
    lineHeight: 16,
    color: C.inkMuted,
  },
};
