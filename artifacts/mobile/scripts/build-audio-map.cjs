/**
 * AUM — Resolve audio briefing publicIds from Cloudinary's Admin API.
 *
 * Real convention discovered (May 2026 upload):
 *   Days     : BRIEFING_DAY_<N>_<TITLE>_<suffix>     (N is 1..50, NOT zero-padded)
 *   Barnaby  : BARNABY_BUCKLEY_<TITLE>_<suffix>
 *   Sterling : ARTHUR_STERLING_<TITLE>_<suffix>
 *   Crane    : VICTOR_KRANE_<TITLE>_<suffix>          (intentional "KRANE" spelling)
 *
 * Files were uploaded to the root (no folder prefix) so the publicId IS the
 * full identifier. Audio uploads use the `video` resource type by Cloudinary
 * convention.
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Usage:
 *   cd artifacts/mobile && node scripts/build-audio-map.cjs
 *
 * Writes `src/data/audioMapResolved.json`. The runtime `src/data/audioMap.ts`
 * reads from that JSON and falls back to stub URLs if it's missing.
 */

/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD || !KEY || !SECRET) {
  console.error(
    "Missing one of: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
  );
  process.exit(1);
}

const auth = "Basic " + Buffer.from(`${KEY}:${SECRET}`).toString("base64");

async function listAllAudio() {
  const all = [];
  let nextCursor;
  do {
    const url = new URL(
      `https://api.cloudinary.com/v1_1/${CLOUD}/resources/video`,
    );
    url.searchParams.set("type", "upload");
    url.searchParams.set("max_results", "500");
    if (nextCursor) url.searchParams.set("next_cursor", nextCursor);
    const res = await fetch(url, { headers: { Authorization: auth } });
    if (!res.ok) {
      throw new Error(
        `Cloudinary list failed: ${res.status} ${await res.text()}`,
      );
    }
    const json = await res.json();
    all.push(...(json.resources || []));
    nextCursor = json.next_cursor;
  } while (nextCursor);
  return all;
}

(async () => {
  const all = await listAllAudio();
  console.log(`Found ${all.length} total audio resources`);

  const intros = { barnaby: null, sterling: null, crane: null };
  const days = {};

  for (const r of all) {
    const id = r.public_id;
    if (/^BARNABY_BUCKLEY_/i.test(id)) intros.barnaby = id;
    else if (/^ARTHUR_STERLING_/i.test(id)) intros.sterling = id;
    else if (/^VICTOR_KRANE_/i.test(id) || /^VICTOR_CRANE_/i.test(id)) {
      intros.crane = id;
    } else {
      const m = id.match(/^BRIEFING_DAY_(\d{1,2})_/i);
      if (m) {
        const n = String(parseInt(m[1], 10)).padStart(2, "0");
        if (days[n]) {
          console.warn(`Duplicate day ${n}: keeping ${days[n]}, skipping ${id}`);
        } else {
          days[n] = id;
        }
      }
    }
  }

  const missing = [];
  for (const k of ["barnaby", "sterling", "crane"]) {
    if (!intros[k]) missing.push(`intro:${k}`);
  }
  for (let d = 1; d <= 50; d++) {
    const key = String(d).padStart(2, "0");
    if (!days[key]) missing.push(`day:${key}`);
  }
  console.log(
    `Resolved: ${Object.values(intros).filter(Boolean).length}/3 intros, ` +
      `${Object.keys(days).length}/50 days. Missing ${missing.length}.`,
  );
  if (missing.length) {
    console.warn(`  Missing: ${missing.join(", ")}`);
  }

  const out = {
    cloud: CLOUD,
    intros,
    days,
    generatedAt: new Date().toISOString(),
  };

  const outPath = path.join(
    __dirname,
    "..",
    "src",
    "data",
    "audioMapResolved.json",
  );
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
