/**
 * AUM — Audio briefing URL map.
 *
 * STUB STATE (current): every URL below is a placeholder following the spec'd
 * naming convention `briefings/briefing_day_NN.mp3` and `briefings/<character>_intro.mp3`.
 * Cloudinary appends a random 6-char suffix to every upload (e.g. portraits ended
 * up as `31.Uncle_Buckley_mlnlal`), so these names will almost certainly NOT
 * resolve until either:
 *   (a) the user uploads the files using these exact publicIds (no auto-suffix),
 *       OR
 *   (b) we run `scripts/build-audio-map.cjs` to enumerate the briefings/ folder
 *       via the Cloudinary Admin API and overwrite this file with real publicIds.
 *
 * Until then, the AudioPlayer component will show "AUDIO UNAVAILABLE" on tap —
 * a graceful degradation, not a crash. The UI is fully wired and ready.
 *
 * URL pattern for Cloudinary audio (audio uploads use the `video/upload` path
 * by Cloudinary convention):
 *   https://res.cloudinary.com/<cloud>/video/upload/<publicId>.mp3
 */

const CLOUD =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "diujqvfed";
const BASE = `https://res.cloudinary.com/${CLOUD}/video/upload`;

/** True while the map is still all-stubs (no real publicIds wired yet). */
export const AUDIO_STUBS_ACTIVE = true;

const stub = (id: string): string => `${BASE}/briefings/${id}.mp3`;

export type IntroKey = "barnaby" | "sterling" | "crane";

const INTRO: Record<IntroKey, string> = {
  barnaby: stub("barnaby_intro"),
  sterling: stub("sterling_intro"),
  crane: stub("crane_intro"),
};

const DAY: Record<string, string> = {};
for (let d = 1; d <= 50; d++) {
  const key = String(d).padStart(2, "0");
  DAY[key] = stub(`briefing_day_${key}`);
}

/** Get the briefing audio URL for a 1-based day number, or null if unmapped. */
export function audioForDay(day: number): string | null {
  const key = String(day).padStart(2, "0");
  return DAY[key] ?? null;
}

/** Get the intro audio URL for a story character. */
export function audioForIntro(who: IntroKey): string | null {
  return INTRO[who] ?? null;
}

/** Full map (debug / admin views). */
export const audioMap = {
  intros: INTRO,
  days: DAY,
} as const;
