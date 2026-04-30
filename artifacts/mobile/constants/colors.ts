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
  divider: "#E5E5E5",
  dividerStrong: "#D4D4D4",
  ink: "#3C4858",
  inkSoft: "#5B6573",
  inkMuted: "#8A93A0",
  accent: "#A35252",
  accentDark: "#7E3E3E",
  positive: "#5B7A5B",
  negative: "#A35252",
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
