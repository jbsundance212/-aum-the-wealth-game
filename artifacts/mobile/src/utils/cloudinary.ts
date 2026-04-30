/**
 * Cloudinary image helpers for AUM portraits.
 *
 * Every photo in the AUM-TITANS Cloudinary folder has a randomized
 * 6-character upload suffix (e.g. `9.Ray_Dalio_vjm7ow`), so publicIds
 * cannot be derived from a name. The map of dayNumber → publicId and
 * character → publicId is generated at build time by
 * `scripts/build-titan-photos.cjs` and baked into `data/titanPhotos.json`,
 * which is what we read at runtime.
 *
 * URL pattern (face-detected, circular crop):
 *   https://res.cloudinary.com/<cloud>/image/upload/w_<n>,h_<n>,c_fill,g_face,r_max/<publicId>.jpg
 *
 * Notes:
 *  - The publicId does NOT include the AUM-TITANS folder prefix; the folder
 *    is metadata only. URLs reference the bare publicId.
 *  - The `.jpg` extension is required because the publicIds contain dots
 *    (e.g. "1._Paul_A._Volcker_rxv9iv") and Cloudinary's URL parser would
 *    otherwise treat the trailing fragment as the format.
 *  - The cloud name is exposed to the client via
 *    EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME — it is intentionally public, it
 *    appears in every served image URL. The API key + secret are
 *    server-side only and used only by the build script.
 */

import titanPhotos from "@/src/data/titanPhotos.json";

export const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "diujqvfed";

const BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Build a Cloudinary URL for a circular, face-detected portrait crop.
 * `size` is the rendered side length in CSS pixels; we serve at 2× for
 * retina screens.
 */
export function cloudinaryFace(publicId: string, size = 200): string {
  const px = Math.max(1, Math.round(size * 2));
  return `${BASE}/w_${px},h_${px},c_fill,g_face,r_max/${publicId}.jpg`;
}

export type CharacterKey = "barnaby" | "sterling" | "victor";

/** Cloudinary publicId for a story character, or null if not uploaded. */
export function characterPublicId(key: CharacterKey): string | null {
  return (titanPhotos.characters as Record<string, string | null>)[key] || null;
}

/** Face URL for a known story character, or null if not uploaded. */
export function characterFace(key: CharacterKey, size = 200): string | null {
  const id = characterPublicId(key);
  return id ? cloudinaryFace(id, size) : null;
}

/** Cloudinary publicId for a Titan by 1-based day number, or null if missing. */
export function titanPublicId(dayNumber: number): string | null {
  return (titanPhotos.days as Record<string, string | null>)[String(dayNumber)] || null;
}

/** Face URL for a Titan by 1-based day number, or null if no photo exists. */
export function titanFace(dayNumber: number, size = 200): string | null {
  const id = titanPublicId(dayNumber);
  return id ? cloudinaryFace(id, size) : null;
}
