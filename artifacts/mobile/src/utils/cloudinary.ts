/**
 * Cloudinary image helpers for AUM portraits.
 *
 * All character and Titan photos are served from Cloudinary with a
 * face-aware circular crop:
 *   https://res.cloudinary.com/<cloud>/image/upload/w_<n>,h_<n>,c_fill,g_face,r_max/<publicId>
 *
 * The cloud name comes from EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME (the value
 * is public — it appears in every served URL — so it is intentionally
 * exposed via the EXPO_PUBLIC_ prefix). A literal fallback ensures the
 * app still renders portraits if the env var is somehow missing at
 * bundle time.
 */

export const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "diujqvfed";

const BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Build a Cloudinary URL for a circular, face-detected portrait crop.
 * `size` is the side length in CSS pixels; we render at 2× for retina.
 */
export function cloudinaryFace(publicId: string, size = 200): string {
  const px = Math.max(1, Math.round(size * 2));
  return `${BASE}/w_${px},h_${px},c_fill,g_face,r_max/${publicId}`;
}

/**
 * Convert a display name (character or Titan) into a Cloudinary publicId.
 * Lowercases, strips punctuation, and collapses runs of non-alphanumeric
 * characters into single hyphens.
 *
 *   "Paul Volcker"     -> "paul-volcker"
 *   "A.W. Phillips"    -> "a-w-phillips"
 *   "J.M. Keynes"      -> "j-m-keynes"
 *   "Barnaby Buckley"  -> "barnaby-buckley"
 */
export function nameToPublicId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Canonical publicIds for the three story characters. These map the
 * informal name used in the codebase to the full public-id stored in
 * Cloudinary.
 */
export const CHARACTER_PUBLIC_IDS = {
  barnaby: "barnaby-buckley",
  sterling: "arthur-sterling",
  victor: "victor-crane",
} as const;

export type CharacterKey = keyof typeof CHARACTER_PUBLIC_IDS;

/** Convenience: face URL for a known character. */
export function characterFace(key: CharacterKey, size = 200): string {
  return cloudinaryFace(CHARACTER_PUBLIC_IDS[key], size);
}
