/**
 * AUM — Audio briefing URL map.
 *
 * RESOLVED STATE (post-upload): real Cloudinary publicIds are baked into
 * `audioMapResolved.json` by `scripts/build-audio-map.cjs`. This module reads
 * from that JSON; if it ever returns a stub fallback (e.g. the JSON is missing
 * after a fresh clone), the AudioPlayer component degrades gracefully.
 *
 * To refresh after new uploads:
 *   cd artifacts/mobile && node scripts/build-audio-map.cjs
 *
 * URL pattern for Cloudinary audio (audio uploads use the `video/upload` path
 * by Cloudinary convention):
 *   https://res.cloudinary.com/<cloud>/video/upload/<publicId>.mp3
 */

import resolved from "./audioMapResolved.json";

const CLOUD =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  resolved.cloud ||
  "diujqvfed";
const BASE = `https://res.cloudinary.com/${CLOUD}/video/upload`;

export type IntroKey = "barnaby" | "sterling" | "crane";

type ResolvedShape = {
  cloud: string;
  intros: Record<IntroKey, string | null>;
  days: Record<string, string>;
  generatedAt?: string;
};

const data = resolved as ResolvedShape;

/**
 * True only while no real publicIds are present (i.e. the resolved JSON is
 * empty/stub). Surface state for any debug/admin UI; the runtime player
 * doesn't need this gate.
 */
export const AUDIO_STUBS_ACTIVE =
  Object.keys(data.days).length === 0 &&
  !data.intros.barnaby &&
  !data.intros.sterling &&
  !data.intros.crane;

const url = (publicId: string | null): string | null =>
  publicId ? `${BASE}/${publicId}.mp3` : null;

const INTRO: Record<IntroKey, string | null> = {
  barnaby: url(data.intros.barnaby),
  sterling: url(data.intros.sterling),
  crane: url(data.intros.crane),
};

const DAY: Record<string, string | null> = {};
for (let d = 1; d <= 50; d++) {
  const key = String(d).padStart(2, "0");
  DAY[key] = url(data.days[key] ?? null);
}

/** Get the briefing audio URL for a 1-based day number, or null if unmapped. */
export function audioForDay(day: number): string | null {
  const key = String(day).padStart(2, "0");
  return DAY[key] ?? null;
}

/** Get the intro audio URL for a story character, or null if unmapped. */
export function audioForIntro(who: IntroKey): string | null {
  return INTRO[who] ?? null;
}

/** Full map (debug / admin views). */
export const audioMap = {
  intros: INTRO,
  days: DAY,
} as const;
