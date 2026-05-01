import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FONT } from "@/src/theme/typography";

// House style for character "no-photo" avatars across the app.
// Per design spec: circular mist-grey field, charcoal initials in Public Sans
// SemiBold, with a 2px UBS Red ring. Used wherever a real photo is unavailable
// (Sterling/Barnaby), wherever a real photo fails to load (Victor fallback),
// or anywhere we deliberately want the placeholder treatment.
const RING_BG = "#E8EBF0";
const RING_BORDER = "#CC0000";
const RING_BORDER_WIDTH = 2;
const INITIALS_COLOR = "#3C4858";

function deriveInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((token) => token[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Props = {
  /** Full display name; first letters of the first two words become initials. */
  name: string;
  /** Outer rendered diameter in CSS pixels. */
  size: number;
  /** Optional remote photo URL. Ignored when `forceInitials` is true. */
  photoUri?: string | null;
  /**
   * When true, never attempt the photo — render initials immediately.
   * Use this for characters with no real photograph yet (Sterling, Barnaby).
   */
  forceInitials?: boolean;
};

export function CharacterAvatar({
  name,
  size,
  photoUri,
  forceInitials,
}: Props) {
  const [failed, setFailed] = useState(false);

  // Reset failure state if the URL changes — otherwise a previous failed
  // load would permanently lock subsequent valid URIs into the fallback.
  useEffect(() => {
    setFailed(false);
  }, [photoUri]);

  const showPhoto = !forceInitials && !!photoUri && !failed;
  const initials = deriveInitials(name);

  // The mist-grey field + red ring is the *initials* treatment, not a frame
  // around real photos. When a real character photo loads successfully (e.g.
  // Victor), render the photo unadorned. Only when we fall through to
  // initials do we render the bordered, mist-grey disc.
  if (showPhoto) {
    return (
      <Image
        source={{ uri: photoUri! }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        contentFit="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            // Scale typography to the avatar size so a 48px chip and a 220px
            // hero portrait both look balanced without per-call-site tuning.
            fontSize: Math.round(size * 0.36),
            letterSpacing: Math.max(1, size * 0.02),
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: RING_BG,
    borderWidth: RING_BORDER_WIDTH,
    borderColor: RING_BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    fontFamily: FONT.bodySemiBold,
    color: INITIALS_COLOR,
  },
});
