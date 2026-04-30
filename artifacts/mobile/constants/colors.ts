/**
 * AUM — UBS Swiss White Standard palette.
 *
 * Strict design language: off-white background, charcoal text,
 * crimson accent, hairline dividers, ZERO border radius.
 *
 * The legacy keys (background, foreground, primary, etc.) are preserved
 * for the scaffold's ErrorFallback so it still renders cleanly.
 */

const palette = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F4F4",
  cream: "#FAF7F2",
  divider: "#E8EBF0",
  dividerStrong: "#D4D4D4",
  ink: "#3C4858",
  inkSoft: "#5B6573",
  inkMuted: "#8A94A6",
  accent: "#CC0000",
  accentDark: "#990000",
  positive: "#CC0000",
  negative: "#CC0000",
  gold: "#B5973F",
  scrim: "rgba(60,72,88,0.72)",
};

const colors = {
  ...palette,
  light: {
    // AUM tokens
    ...palette,

    // Scaffold-compatible aliases (used by ErrorFallback only)
    text: palette.ink,
    tint: palette.accent,
    background: palette.bg,
    foreground: palette.ink,
    card: palette.surface,
    cardForeground: palette.ink,
    primary: palette.accent,
    primaryForeground: "#FFFFFF",
    secondary: palette.surfaceAlt,
    secondaryForeground: palette.ink,
    muted: palette.surfaceAlt,
    mutedForeground: palette.inkMuted,
    accentForeground: "#FFFFFF",
    destructive: palette.accent,
    destructiveForeground: "#FFFFFF",
    border: palette.divider,
    input: palette.divider,
  },
  // Border radius — strictly zero per UBS Swiss White standard.
  radius: 0,
};

export default colors;
export const C = palette;
