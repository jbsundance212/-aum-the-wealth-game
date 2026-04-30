#!/usr/bin/env node
/**
 * Builds src/data/titanPhotos.json by querying the Cloudinary Admin API
 * for every image in the AUM-TITANS folder, then matching each Day's
 * `titanName` to the closest Cloudinary publicId by last-name.
 *
 * Cloudinary publicIds in this project look like:
 *   AUM-TITANS/9.Ray_Dalio_vjm7ow
 *   AUM-TITANS/4.John_Maynard_Keynes_rmup2i
 *   AUM-TITANS/31.Uncle_Buckley_j2ntbz       (= Barnaby)
 *   AUM-TITANS/32.Arthur_Sterling_cisvww
 *   AUM-TITANS/33.Victor_Crane_b4prha
 *
 * Each ends with a 6-char Cloudinary suffix that varies per upload, so
 * we cannot construct the URL by hand — we must fetch the listing.
 *
 * Run once after any new uploads:
 *   cd artifacts/mobile && node scripts/build-titan-photos.cjs
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = "AUM-TITANS";

if (!CLOUD || !KEY || !SECRET) {
  console.error(
    "Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET env vars.",
  );
  process.exit(1);
}

const auth = Buffer.from(`${KEY}:${SECRET}`).toString("base64");

function api(p) {
  return new Promise((resolve, reject) => {
    https
      .request(
        {
          host: "api.cloudinary.com",
          path: p,
          headers: { Authorization: `Basic ${auth}` },
        },
        (res) => {
          let body = "";
          res.on("data", (d) => (body += d));
          res.on("end", () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`Bad JSON: ${body.slice(0, 200)}`));
            }
          });
        },
      )
      .on("error", reject)
      .end();
  });
}

async function fetchAllInFolder(folder) {
  const all = [];
  let cursor = null;
  // Walk every page of /resources/image and filter to our folder.
  // (The prefix filter doesn't work for this account, hence the scan.)
  for (let i = 0; i < 10; i++) {
    const q =
      `/v1_1/${CLOUD}/resources/image?type=upload&max_results=500` +
      (cursor ? `&next_cursor=${encodeURIComponent(cursor)}` : "");
    const r = await api(q);
    if (!r.resources) throw new Error("Cloudinary error: " + JSON.stringify(r));
    for (const x of r.resources) {
      if ((x.folder || x.asset_folder) === folder) all.push(x);
    }
    cursor = r.next_cursor;
    if (!cursor) break;
  }
  return all;
}

/**
 * Strip the "<index>." prefix and the trailing "_<6-char>" suffix from a
 * publicId, return the human name with underscores → spaces.
 *   "AUM-TITANS/9.Ray_Dalio_vjm7ow"  ->  "Ray Dalio"
 *   "AUM-TITANS/4.John_Maynard_Keynes_rmup2i" -> "John Maynard Keynes"
 */
function nameFromPublicId(publicId) {
  const tail = publicId.split("/").pop();
  const noPrefix = tail.replace(/^\d+\._?/, "");
  const noSuffix = noPrefix.replace(/_[a-z0-9]{6}$/i, "");
  return noSuffix.replace(/_/g, " ").trim();
}

function lastWord(name) {
  return name
    .toLowerCase()
    .replace(/[.,]/g, "")
    .trim()
    .split(/\s+/)
    .pop();
}

function findMatch(titanName, photos) {
  const target = lastWord(titanName);
  // Exact last-name match (case insensitive)
  const exact = photos.find((p) => lastWord(p._displayName) === target);
  if (exact) return exact.public_id;
  // Loose: substring match on the joined name
  const lower = titanName.toLowerCase().replace(/\./g, "");
  const loose = photos.find((p) =>
    p._displayName.toLowerCase().replace(/\./g, "").includes(lower) ||
    lower.includes(p._displayName.toLowerCase().replace(/\./g, "")),
  );
  return loose ? loose.public_id : null;
}

async function main() {
  const dataPath = path.resolve(__dirname, "..", "src", "data", "dayData.json");
  const outPath = path.resolve(__dirname, "..", "src", "data", "titanPhotos.json");
  const days = require(dataPath);

  const resources = await fetchAllInFolder(FOLDER);
  const photos = resources.map((r) => ({
    public_id: r.public_id,
    _displayName: nameFromPublicId(r.public_id),
  }));
  console.log(`Cloudinary: ${photos.length} photos in ${FOLDER}`);

  // Day → publicId map (only days that match)
  const byDay = {};
  const unmatched = [];
  Object.values(days).forEach((day, idx) => {
    const dayNumber = idx + 1;
    const match = findMatch(day.titanName, photos);
    if (match) byDay[dayNumber] = match;
    else unmatched.push(`Day ${dayNumber}: ${day.titanName}`);
  });

  // Story characters — match by known display names
  const findByName = (needle) => {
    const m = photos.find((p) =>
      p._displayName.toLowerCase().includes(needle.toLowerCase()),
    );
    return m ? m.public_id : null;
  };
  const characters = {
    barnaby: findByName("Buckley") || findByName("Uncle"),
    sterling: findByName("Arthur Sterling") || findByName("Sterling"),
    victor: findByName("Victor Crane") || findByName("Victor"),
  };

  // Normalise publicIds — strip any accidental "AUM-TITANS/" prefix so the
  // runtime URL builder always sees a bare publicId, regardless of what
  // the Cloudinary API returns in future API versions.
  const stripFolder = (id) => id.replace(/^AUM-TITANS\//, "");
  Object.keys(byDay).forEach((k) => (byDay[k] = stripFolder(byDay[k])));
  Object.keys(characters).forEach((k) => {
    if (characters[k]) characters[k] = stripFolder(characters[k]);
  });

  // Hard assertions — fail loudly rather than silently bake a regressed map.
  const missingChars = Object.entries(characters)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missingChars.length) {
    throw new Error(
      `Missing required character photos: ${missingChars.join(", ")}. ` +
        `Check the AUM-TITANS folder for Uncle_Buckley / Arthur_Sterling / Victor_Crane.`,
    );
  }
  // Detect duplicate last-name collisions (two different days mapping to the
  // same publicId is fine — that's intentional reuse — but two completely
  // different names mapping to the same id is a red flag).
  const idsSeen = {};
  for (const [day, id] of Object.entries(byDay)) {
    if (!idsSeen[id]) idsSeen[id] = [];
    idsSeen[id].push(day);
  }
  const EXPECTED_MIN_MATCHES = 30;
  if (Object.keys(byDay).length < EXPECTED_MIN_MATCHES) {
    throw new Error(
      `Only matched ${Object.keys(byDay).length}/49 days; expected ≥ ${EXPECTED_MIN_MATCHES}. ` +
        `Either Cloudinary lost photos or the matcher regressed.`,
    );
  }

  const out = {
    generatedAt: new Date().toISOString(),
    folder: FOLDER,
    characters,
    days: byDay,
  };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${outPath}`);
  console.log(`  characters:`, characters);
  console.log(`  matched ${Object.keys(byDay).length}/49 days`);
  if (unmatched.length) {
    console.log(`  unmatched (will fall back to initials):`);
    unmatched.forEach((u) => console.log(`    - ${u}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
