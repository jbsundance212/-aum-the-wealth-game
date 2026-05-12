/**
 * AUM — Build the audio briefing URL map from Cloudinary's Admin API.
 *
 * Run AFTER all 53 audio files (3 character intros + 50 day briefings) have
 * been uploaded to the Cloudinary `briefings/` folder. This script enumerates
 * the folder, matches publicIds against the expected naming convention, and
 * overwrites `src/data/audioMap.ts` with real, working URLs.
 *
 * Naming convention expected:
 *   - briefings/barnaby_intro.<suffix>      → intro key "barnaby"
 *   - briefings/sterling_intro.<suffix>     → intro key "sterling"
 *   - briefings/crane_intro.<suffix>        → intro key "crane"
 *   - briefings/briefing_day_NN.<suffix>    → day NN (01..50)
 *
 * Cloudinary appends a random 6-char suffix to every upload by default, so
 * the actual publicIds will be e.g. `briefings/briefing_day_01_a1b2c3`. This
 * script tolerates that — it matches the leading prefix and uses whatever
 * publicId Cloudinary returned.
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Usage:
 *   cd artifacts/mobile && node scripts/build-audio-map.cjs
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

const auth =
  "Basic " + Buffer.from(`${KEY}:${SECRET}`).toString("base64");

async function listFolder(prefix) {
  // Audio uploads use Cloudinary's `video` resource type.
  const url = new URL(
    `https://api.cloudinary.com/v1_1/${CLOUD}/resources/video`,
  );
  url.searchParams.set("type", "upload");
  url.searchParams.set("prefix", prefix);
  url.searchParams.set("max_results", "500");

  const res = await fetch(url, { headers: { Authorization: auth } });
  if (!res.ok) {
    throw new Error(
      `Cloudinary list failed: ${res.status} ${await res.text()}`,
    );
  }
  const json = await res.json();
  return json.resources || [];
}

(async () => {
  const resources = await listFolder("briefings/");
  console.log(`Found ${resources.length} audio resources in briefings/`);

  const intros = { barnaby: null, sterling: null, crane: null };
  const days = {};

  for (const r of resources) {
    const id = r.public_id; // e.g. "briefings/briefing_day_01_a1b2c3"
    const bare = id.replace(/^briefings\//, "");

    if (/^barnaby_intro/.test(bare)) intros.barnaby = id;
    else if (/^sterling_intro/.test(bare)) intros.sterling = id;
    else if (/^crane_intro/.test(bare)) intros.crane = id;
    else {
      const m = bare.match(/^briefing_day_(\d{2})/);
      if (m) {
        days[m[1]] = id;
      } else {
        console.warn(`Skipping unmatched: ${id}`);
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
  if (missing.length) {
    console.warn(
      `\n⚠ Missing ${missing.length} audio file(s):\n  ${missing.join("\n  ")}\n`,
    );
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
  console.log(
    `\nNext: edit src/data/audioMap.ts to read from audioMapResolved.json`,
  );
  console.log(`(or have the agent do it once this file exists).`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
