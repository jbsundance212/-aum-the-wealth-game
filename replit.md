# AUM — The Wealth Game

A 49-day Expo mobile app for institutional-grade wealth management
education with a gamified portfolio simulator. Built around the fictional
Vane-Buckley Trust, narrated by executor Arthur Sterling, with a rival
beneficiary (Victor Crane) who advances $50,000 per completed day.

## Visual identity — UBS Swiss White Standard

- Background `#FAFAFA` (off-white)
- Text `#3C4858` (charcoal)
- Accent `#A35252` (crimson)
- Hairline dividers `#E5E5E5`
- Border radius: **0** everywhere
- Body type: Public Sans (400 / 500 / 600 / 700)
- Numerals: JetBrains Mono (400 / 700) — used for every $ amount and
  ticker

These tokens live in `artifacts/mobile/constants/colors.ts` and
`artifacts/mobile/src/theme/typography.ts`.

## Architecture

Two artifacts:
- `artifacts/mobile` — Expo SDK 54 + expo-router 6 mobile app (the game)
- `artifacts/api-server` — Express service backing the public leaderboard,
  Discord bot, and daily Victor Crane taunt cron job (mounted on `/api`)

### Data pipeline (pre-build)

The Excel workbook
`attached_assets/AUM_Replit_DRAFT_v1_25_1777548236625.xlsx`
is parsed at build time by
`artifacts/mobile/scripts/build-day-data.cjs` into
`artifacts/mobile/src/data/dayData.json` (~1MB, 49 days).

To refresh after an Excel edit:
```
cd artifacts/mobile && node scripts/build-day-data.cjs
```

The script understands two question formats (early days use
`CORRECT: A` / `STERLING_CORRECT:` markers; later days use inline
`[CORRECT — …]` / `[WRONG — …]` markers) and parses the JSON in the
`Bourse_Params` cell. Days 28-49 have narrative-only Momentum signals
(no quiz) — flagged with `hasQuiz: false` so the Momentum screen
renders the narrative variant.

### Brand mark

The AUM mark (4 ascending bars climbing grey → `#CC0000`, then bold
"AUM" in Times serif `#CC0000`) lives as a React Native SVG component
at `artifacts/mobile/src/components/BrandMark.tsx`. The same artwork
is mirrored as a static SVG at `artifacts/mobile/assets/aum_logo.svg`
and rendered to a 1200×1200 PNG splash asset at
`artifacts/mobile/assets/images/splash.png` via
`artifacts/mobile/scripts/render-splash.sh` (uses ImageMagick `magick`).

The mark appears in three places:
- Native splash — `app.json` → `expo.splash.image`
- JS splash overlay — `src/components/SplashOverlay.tsx`, mounted from
  `app/_layout.tsx`; holds for 700 ms then fades out (320 ms) once
  fonts are loaded so the hand-off from native splash to first route
  is seamless.
- Login (`app/login.tsx`) and the global Header (`src/components/Header.tsx`).

To regenerate the splash PNG after editing the SVG:
```
cd artifacts/mobile && ./scripts/render-splash.sh
```

### Routes (file-based)

```
app/
  _layout.tsx            providers, fonts, transaction toast overlay
  index.tsx              boot router (login → onboarding → tabs)
  login.tsx              beneficiary acknowledgement
  onboarding.tsx         3-chapter intro (Barnaby, Sterling, Victor)
  (tabs)/
    _layout.tsx          4-tab bar
    index.tsx            Today (KPI row + Day card + recent ledger)
    curriculum.tsx       49-day grid grouped by pillar
    ledger.tsx           NAV, credits / penalties, transaction log
    leaderboard.tsx      duel header + cohort standings
  day/[id]/
    index.tsx            Day Hub — 8 stations + completion bonus
    briefing.tsx         3-slide read (+$10,000)
    masterclass.tsx      YouTube player with browser fallback (+$20,000)
    titan.tsx            Bio + lesson + playbook (+$15,000)
    stress.tsx           Quiz ±$50,000 / $25,000
    diagnostic.tsx       Quiz ±$30,000 / $15,000
    momentum.tsx         Quiz or narrative ±$40,000 / $20,000
    sterling.tsx         Daily memorandum (+$5,000)
    bourse.tsx           4-phase live trading game
```

### State

Single `StoreProvider` (`artifacts/mobile/src/data/store.tsx`) holds
profile, NAV, Victor's NAV, current day, transactions, completion
map, and days completed. Persists to AsyncStorage. All ledger writes
also fire a top-of-screen `TransactionToast`.

Day completion logic: when all 8 stations are recorded the Day Hub
auto-fires `finalizeDay` — posts a +$25,000 bonus, advances
`currentDay`, and credits Victor with $50,000.

### The Bourse

`artifacts/mobile/app/day/[id]/bourse.tsx` implements a 30-second
mark-to-market simulator:

1. **Intro** — environment label + description + win condition
2. **Allocate** — sliders 0-100% per asset, must total 100%
3. **Running** — 50 ticks @ 600ms; each tick:
   `price *= 1 + drift/50 + (vol/√50) * gauss()` with a 5%
   bankruptcy floor. Live tape, countdown, animated PnL.
4. **Complete** — verdict card + Sterling's win/loss memo, then
   credits the closeout proceeds back to the ledger.

The $100,000 stake is debited at launch and the proceeds are credited
on close, so the ledger always reflects real cash flows.

## Workflows

- `artifacts/mobile: expo` — runs `pnpm dev` (Expo Go web preview)
- `artifacts/api-server: API Server` — scaffold backend (unused by
  the mobile app today)
- `artifacts/mockup-sandbox: Component Preview Server` — design sandbox

## Cloudinary portraits

Character + Titan portraits are served from Cloudinary
(cloud `diujqvfed`, folder `AUM-TITANS`, 32 photos covering 35 of 49
days plus the three story characters). All portraits render as
circular face-detected crops via the URL pattern:

```
https://res.cloudinary.com/diujqvfed/image/upload/w_<2x>,h_<2x>,c_fill,g_face,r_max/<publicId>.jpg
```

Two non-obvious requirements (both encoded in
`src/utils/cloudinary.ts`):

1. The `publicId` does NOT include the `AUM-TITANS/` folder prefix —
   the folder is metadata only.
2. The `.jpg` extension is mandatory because publicIds contain dots
   (`1._Paul_A._Volcker_rxv9iv`); without `.jpg`, Cloudinary's URL
   parser misinterprets the trailing fragment as the format.

Cloudinary appends a random 6-char suffix to every upload, so
publicIds cannot be derived from a name. The day → publicId map is
built once via the Admin API and baked into
`src/data/titanPhotos.json`. To refresh after new uploads:

```
cd artifacts/mobile && node scripts/build-titan-photos.cjs
```

Requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET` env vars. The cloud name is also exposed to
the app via `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` (it is intentionally
public — it appears in every served URL). The API key + secret are
build-time only.

Helpers in `src/utils/cloudinary.ts`:
- `cloudinaryFace(publicId, size)` — base URL builder
- `characterFace("barnaby" | "sterling" | "victor", size)`
- `titanFace(dayNumber, size)` — returns null for archetype-only days
  (15-26, 30, 43); call sites fall back to initials in those cases.

Used in: `app/(tabs)/leaderboard.tsx` (Victor 56), `app/day/[id]/titan.tsx`
(Titan portrait 92, with initials fallback), and `app/onboarding.tsx`
slide three (Victor only — see CharacterAvatar below).

## CharacterAvatar (photo + initials fallback)

`src/components/CharacterAvatar.tsx` is the canonical avatar component
for the three story characters and acts as the onError fallback when a
remote photo fails to load. The treatment has two states:

- **Photo state**: when `photoUri` is provided and loads successfully,
  the component renders the image as a plain circular crop with no
  border or chrome.
- **Initials state**: when `forceInitials` is set, no `photoUri` is
  given, or the image errors, the component renders the project's house
  placeholder — circular mist-grey field `#E8EBF0` (= `C.divider`),
  charcoal initials `#3C4858` in Public Sans SemiBold sized at ~36% of
  the diameter, and a 2px UBS Red `#CC0000` ring.

Props: `name`, `size`, optional `photoUri`, optional `forceInitials`.

Used in:
- `app/onboarding.tsx` chapters 1–3 — Barnaby, Sterling and Victor all
  use their Cloudinary photos via `characterFace(...)`, with the
  initials state as automatic onError fallback.
- `app/login.tsx` — Sterling crest portrait, Cloudinary photo with
  initials fallback.
- `src/components/SterlingMessage.tsx` — 48px memo chip, Cloudinary
  photo with initials fallback.
- `app/day/[id]/titan.tsx` — Days 14 + 49 (i.e. when
  `data.titanName === "Arthur Sterling"`) render through
  `CharacterAvatar` so they share the same photo+fallback contract.
  Other Titan days keep the rectangular dark-bust frame.

Cloudinary publicIds for the three characters live in
`src/data/titanPhotos.json` under `characters` (Sterling
`32.Arthur_Sterling_cisvww`, Barnaby `31.Uncle_Buckley_mlnlal`, Victor
`33.Victor_Crane_b4prha`). `characterFace(key, size)` builds the
face-cropped URL used by all four call-sites above. Days 14 and 49 in
`titanPhotos.json.days` also point to the Sterling publicId so
`titanFace(day)` returns the same URL for the daily titan view.

## Branding copy

The Vane-Buckley Trust crest reads `EST. 1923 · GENEVA`
(`app/login.tsx`). Do not change to Zürich — the brand voice and
on-screen copy use Geneva throughout.

## Discord + Supabase leaderboard

Public cohort leaderboard + Discord community integration shipped via
`artifacts/api-server`.

### Server side (`artifacts/api-server`)
- `src/lib/supabase.ts` — lazy singleton using `SUPABASE_URL` +
  `SUPABASE_SERVICE_KEY` (service-role key bypasses RLS, server-side only)
- `src/lib/discord.ts` — discord.js v14 bot, lazy `getDiscordClient()` +
  `shutdownDiscordClient()`. Posts to `#bourse-results` and
  `#victor-crane` channels in guild `1499442445195411616`
- `src/lib/cron.ts` — node-cron job at `0 8 * * *` in `Asia/Dubai`
  timezone (DST-safe), posts a Victor taunt every morning at 08:00 GST
- `src/lib/victorTaunts.ts` — pool of 60+ taunts; deterministic daily
  rotation seeded by date
- `src/routes/leaderboard.ts` — three endpoints:
  - `GET  /api/leaderboard` (top 50)
  - `POST /api/leaderboard/sync` (debounced player NAV upsert)
  - `POST /api/leaderboard/bourse-result` (per-Bourse outcome → Discord
    + Supabase)
- `src/index.ts` — boots Discord + cron after `app.listen`, probes the
  Supabase table, registers `SIGTERM`/`SIGINT` handlers for graceful
  shutdown

Required env vars (already set in Replit Secrets):
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`,
`DISCORD_BOT_TOKEN`.

### One-time Supabase setup (REQUIRED)
The leaderboard table is **not** auto-created. Run
`artifacts/api-server/scripts/supabase-leaderboard.sql` once in the
Supabase SQL editor (project → SQL Editor → New query → paste → Run).
The script is idempotent (`create table if not exists` + RLS deny
policies). Until this runs, `GET /api/leaderboard` returns 500 and the
mobile leaderboard screen only shows synthesized rows.

### Mobile side (`artifacts/mobile`)
- `src/data/store.tsx` — persists `userId` (uuid generated once) and
  `displayName` in `AsyncStorage`. A debounced `queueSync` always reads
  the latest snapshot via a ref (concurrent `applyDelta`/`recordStep`/
  `finalizeDay` calls cannot post out-of-order).
- `src/data/leaderboardApi.ts` — fetch/post helpers, fire-and-forget
  (errors only `console.warn`, never thrown).
- `app/onboarding.tsx` — 4th slide collects display name (≥2 chars
  required to enable "Begin Day One").
- `app/(tabs)/leaderboard.tsx` — polls `/api/leaderboard` every 15s
  while focused (re-entrant fetches gated by `inFlightRef`). Always
  synthesises a Victor row at #1 (max real NAV × 1.08, floored at
  starting balance). Inline "SET YOUR DISPLAY NAME" editor for users
  who completed onboarding before the name field existed. "JOIN THE
  COMMUNITY" CTA opens `EXPO_PUBLIC_DISCORD_INVITE_URL` (defaults to
  `https://discord.gg/NamQ6VYc`).
- `app/day/[id]/bourse.tsx` — `finalize()` fires
  `postBourseResult({...})` after each Bourse closeout (fire-and-forget,
  never blocks navigation).

### End-of-Game closeout (`app/end.tsx`)

Reached only after Day 49 closes — the Day Hub's "View Mandate Closure"
button (`app/day/[id]/index.tsx`) `router.replace`s to `/end`. The
screen has a hard guard: if `daysCompleted` does not include 49 it
bounces to the ledger (waits for `loaded` to avoid bouncing during
AsyncStorage hydration), so the route is safe against deep-links.

Three layers + memoriam + closing quote:
- **Layer 1** — looping CHF-bills background video at 0.35 opacity via
  `expo-av` `<Video>` (`endgameVideoUrl()` in `src/utils/cloudinary.ts`,
  `Hyperrealistic_commercial_smal_k7d4kf.mp4`), with a parchment veil
  on top for legibility.
- **Brand seal** — the AUM brand logo (`assets/images/aum_logo.png`,
  required at module-scope as `AUM_LOGO`) sits above a thin gold rule
  and the "MANDATE CLOSED · DAY 49" caption. Replaced an earlier
  text-only "AUM" gold square; the real logo carries the brand mark.
- **Layer 2** — parchment certificate card with gold (#C8A96E) top bar:
  player name (Cormorant Garamond serif, falls back to "Anonymous
  Steward"), italic completion blurb, final AUM via `fmtMoney()`, and a
  Victor Crane / Day 49 footer row. Captured via
  `react-native-view-shot` `captureRef` and shared via `expo-sharing`
  (button: "DOWNLOAD CERTIFICATE").
- **THE DESK YOU SERVED** — a 3-up credits strip sitting between the
  action buttons and the leaderboard. Renders all three named characters
  in a single parchment card: Arthur Sterling (Your Trustee), Barnaby
  Buckley (Founder · 1934–2025), Victor Crane (Chief Antagonist). Every
  portrait is a Cloudinary face crop via
  `characterFace("sterling"|"barnaby"|"victor", 56)` — the URLs are
  memoized once per mount in a `trioFaces` object. Each column renders
  through the local `TrioCard` subcomponent (face circle, name, sub);
  if a Cloudinary URL ever returns null the column falls back to a
  2-letter gold mark (AS / BB / VC) with `accessibilityRole="image"`
  and `accessibilityLabel={name}`. The portraits are the ONLY non-zero
  `borderRadius` on the screen (deliberate — faces are circular per the
  rest of the app's portraiture, e.g. `titan.tsx`).
  Local `assets/images/{barnaby,sterling,victor}.png` files exist as
  legacy fallbacks but **must not** be `require()`'d anywhere — every
  character face in the app is sourced from Cloudinary so we can swap
  imagery centrally via `src/data/titanPhotos.json`.
- **Layer 3** — top-10 leaderboard from `/api/leaderboard` with a
  pulsing red LIVE dot. Current player gets a 2px red left-border
  highlight; if the player ranks below 10 a "YOU — …" row is pinned
  beneath the top 10. Empty/loading states render gracefully.
- **Closing quote** — Victor Crane block with a 2px red left bar.

A "JOIN THE COMMUNITY" button opens `EXPO_PUBLIC_DISCORD_INVITE_URL`
via `Linking.openURL` (disabled if env var missing). A small dismiss X
in the top-right returns to the ledger.

A `?preview=1` query param bypasses the Day-49-complete route guard so
the canvas board (and any future design tooling) can render the screen
against fallback data without playing 49 days. Real players still hit
the hard guard — the bypass is gated on the explicit query param only.

Cormorant Garamond is loaded only here — `_layout.tsx` adds
`CormorantGaramond_400Regular`, `..._400Regular_Italic`, and
`..._600SemiBold` to `useFonts`, exposed as `FONT.serif`,
`FONT.serifItalic`, `FONT.serifSemiBold` in
`src/theme/typography.ts`. Public Sans / JetBrains Mono remain the rest
of the app's voice.

Animations use the RN `Animated` API: a staggered fade+slide sequence
(seal 200ms, certificate 600ms, buttons 1100ms, memoriam 1300ms,
leaderboard 1600ms, quote 2000ms) plus a looping pulse on the LIVE dot.

### Known limitations
- The POST endpoints have **no application-layer authentication** —
  any caller who can reach the Express server can submit leaderboard
  rows. Acceptable for an MVP cohort game; revisit if abuse appears.

## Audio briefings

Reusable audio narration covering every daily briefing (50 days) plus
the three onboarding character intros (Barnaby, Sterling, Crane). All
audio is hosted on Cloudinary alongside the portraits.

### URL convention

Audio files live in the Cloudinary `briefings/` folder and are served
via the `video/upload` path (Cloudinary's convention for audio):

```
https://res.cloudinary.com/<cloud>/video/upload/<publicId>.mp3
```

The expected publicId prefixes are `briefings/briefing_day_NN` for
days and `briefings/<character>_intro` for intros. Cloudinary auto-
appends a 6-char random suffix on upload, so the resolved publicIds
are e.g. `briefings/briefing_day_01_a1b2c3`.

### Stub state (current)

`artifacts/mobile/src/data/audioMap.ts` ships hand-built stub URLs
that follow the convention exactly. `AUDIO_STUBS_ACTIVE = true` in
that file flags the stubs. Until the real files are uploaded these
URLs return 404 — the `AudioPlayer` component degrades gracefully
to "AUDIO UNAVAILABLE" instead of crashing.

### Rebuilding the map after upload

Once all 53 audio files are uploaded:

```
cd artifacts/mobile && node scripts/build-audio-map.cjs
```

The script enumerates the `briefings/` folder via the Cloudinary
Admin API (needs `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`) and writes
`src/data/audioMapResolved.json`. Update `audioMap.ts` to read from
that JSON (mirroring the `titanPhotos.json` pattern) and flip
`AUDIO_STUBS_ACTIVE` to `false`.

### Components + integration

- `src/components/AudioPlayer.tsx` — reusable expo-av player with
  gold (#C8A96E) play/pause + progress bar + JetBrains Mono timing.
  Auto-unloads on unmount, handles 404s gracefully, fires
  `onComplete()` when the file finishes. Supports `autoPlay` and a
  `compact` variant.
- `app/day/[id]/briefing.tsx` — gold ♪ "LISTEN TO BRIEFING" toggle
  in the top-right reveals the player above the briefing text. Gold
  ✓ checkmark appears once the player has finished it (state lives
  in `hasListenedDay(day)`).
- `app/onboarding.tsx` — each character chapter (Barnaby/Sterling/
  Crane) auto-plays its intro audio via `AudioPlayer autoPlay`. The
  "Continue" button is gated until either the audio reports complete
  OR a 10-second fallback timer fires (handles autoplay blocks +
  missing audio). Players who already heard an intro on a prior
  visit unlock immediately. A small mono-grey "SKIP" affordance
  bottom-right jumps straight to the name slide.

### State + Supabase tracking

`src/data/store.tsx` persists two new arrays to AsyncStorage:
`audioListened: number[]` (day briefings) and
`introsListened: IntroAudioKey[]`. `markAudioListened(day)` and
`markIntroListened(who)` update both AsyncStorage and fire a
fire-and-forget POST to `/api/leaderboard/audio` (added to
`leaderboardApi.ts` as `recordAudioListened`).

The server route `POST /api/leaderboard/audio`
(`artifacts/api-server/src/routes/leaderboard.ts`) merges the new
value idempotently into the player's row via Supabase.

### One-time Supabase migration (REQUIRED before audio sync)

The leaderboard table needs two extra columns. Run
`artifacts/api-server/scripts/supabase-audio-tracking.sql` once in
the Supabase SQL editor (idempotent, uses `add column if not exists`
and adds GIN indexes for analytics queries). Until this runs,
`POST /api/leaderboard/audio` returns 503 — the mobile client
silently ignores the failure and tracking still works locally via
AsyncStorage.

## Notes

- `react-native-web-webview` is installed as a peer of
  `react-native-youtube-iframe` so the YouTube player bundles for web.
- Some Expo version warnings (`expo-asset`, `expo-file-system`,
  `react-native-webview`, `@react-native-community/slider`) are visible
  in the Expo CLI startup. They are non-fatal — bundle compiles and
  runs both on web and via Expo Go.
