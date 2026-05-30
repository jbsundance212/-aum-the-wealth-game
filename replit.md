# AUM — The Wealth Game

A 49-day Expo wealth-management game framed around the fictional
Vane-Buckley Trust, narrated by executor Arthur Sterling, with rival
beneficiary Victor Crane advancing $50,000 per completed day.

## Artifacts

- `artifacts/mobile` — Expo SDK 54 + expo-router 6 (the game; target = Web)
- `artifacts/api-server` — Express service mounted on `/api` (leaderboard,
  Discord bot, daily Victor cron, Stripe paywall)
- `artifacts/mockup-sandbox` — design sandbox

## Visual identity (UBS Swiss White)

- BG `#FAFAFA` · Ink `#3C4858` · Crimson accent `#A35252` (UI red `#CC0000`)
- Hairline dividers `#E5E5E5` · Gold accent `#C8A96E` (paywall + end screen)
- **Border radius: 0** everywhere (only exception: circular face crops)
- Body: Public Sans 400/500/600/700 · Numerals: JetBrains Mono 400/700
- Serif: Cormorant Garamond 400/400Italic/600 (paywall, /privacy, /end only)

Tokens live in `artifacts/mobile/constants/colors.ts` and
`artifacts/mobile/src/theme/typography.ts` (`FONT.serif`,
`FONT.serifItalic`, `FONT.serifSemiBold`).

Brand copy: Vane-Buckley crest reads `EST. 1923 · GENEVA` — do **not**
change to Zürich.

## Routes (file-based, expo-router)

```
app/
  _layout.tsx            providers, fonts, transaction toast overlay
  index.tsx              boot router (login → onboarding → tabs)
  login.tsx              beneficiary acknowledgement
  onboarding.tsx         3-chapter intro + name slide
  privacy.tsx            public privacy policy (app-store submission URL)
  paywall.tsx            Stripe Checkout entry
  paywall-success.tsx    server-verifies session, unlocks, → /day/2
  end.tsx                Day-49 mandate closure (guarded)
  (tabs)/
    index.tsx | curriculum.tsx | ledger.tsx | leaderboard.tsx
  day/[id]/
    index.tsx            Day Hub — 8 stations + completion bonus
    briefing.tsx         3-slide read (+$10K)
    masterclass.tsx      YouTube w/ browser fallback (+$20K)
    titan.tsx            Bio + lesson + playbook (+$15K)
    stress.tsx           Quiz ±$50K / $25K
    diagnostic.tsx       Quiz ±$30K / $15K
    momentum.tsx         Quiz or narrative ±$40K / $20K
    sterling.tsx         Daily memorandum (+$5K)
    bourse.tsx           4-phase 30s mark-to-market simulator
```

## State

Single `StoreProvider` (`src/data/store.tsx`) — profile, NAV, Victor's
NAV, currentDay, transactions, completion map, daysCompleted,
audioListened, introsListened, mandateUnlocked. Persists to AsyncStorage.
A debounced `queueSync` always reads the latest snapshot via a ref
(concurrent `applyDelta`/`recordStep`/`finalizeDay` calls cannot post
out-of-order).

`finalizeDay` (8 stations done) → +$25K bonus, advances `currentDay`,
credits Victor +$50K, fires `TransactionToast`.

## The Bourse

`app/day/[id]/bourse.tsx` — 4 phases: **Intro** (env + win condition) →
**Allocate** (sliders sum to 100%) → **Running** (50 ticks @ 600ms,
`price *= 1 + drift/50 + (vol/√50)*gauss()`, 5% bankruptcy floor) →
**Complete** (verdict + Sterling memo). $100K stake debited at launch,
proceeds credited on close — ledger always reflects real cash flows.

## Workflows

- `artifacts/mobile: expo` — `pnpm dev`
- `artifacts/api-server: API Server` — Express
- `artifacts/mockup-sandbox: Component Preview Server` — design sandbox

## Data pipeline (pre-build)

Excel `attached_assets/AUM_Replit_DRAFT_v1_25_1777548236625.xlsx` →
`scripts/build-day-data.cjs` → `src/data/dayData.json` (~1MB, 49 days).
Refresh: `cd artifacts/mobile && node scripts/build-day-data.cjs`.

The script handles two question formats (early days `CORRECT: A` /
`STERLING_CORRECT:` markers; later days inline `[CORRECT — …]` /
`[WRONG — …]`) and parses JSON in `Bourse_Params`. Days 28–49 have
narrative-only Momentum (no quiz) — flagged `hasQuiz: false`.

## Brand mark + splash

`src/components/BrandMark.tsx` — RN-SVG component (4 ascending bars
grey → `#CC0000`, then bold "AUM" Times serif `#CC0000`). Mirrored at
`assets/aum_logo.svg` and rendered to `assets/images/splash.png`
(1200×1200) via `scripts/render-splash.sh` (uses ImageMagick `magick`).

Used in: native splash (`app.json` → `expo.splash.image`),
`SplashOverlay.tsx` (700ms hold + 320ms fade once fonts load),
`app/login.tsx`, `Header.tsx`, `app/privacy.tsx`.

## Cloudinary (portraits + audio)

Cloud `diujqvfed`. Images in folder `AUM-TITANS`, audio at the
Cloudinary root. Cloud name is exposed as
`EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` (intentionally public). Admin-API
build scripts need `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET` (build-time only).

### Portraits — `src/utils/cloudinary.ts`

URL pattern (face-detected circular crops):
```
https://res.cloudinary.com/diujqvfed/image/upload/w_<2x>,h_<2x>,c_fill,g_face,r_max/<publicId>.jpg
```

Two non-obvious requirements:
1. `publicId` does NOT include the `AUM-TITANS/` folder prefix (folder
   is metadata only).
2. `.jpg` extension is **mandatory** — publicIds contain dots
   (`1._Paul_A._Volcker_rxv9iv`); without `.jpg` Cloudinary's URL
   parser misinterprets the trailing fragment as the format.

Helpers: `cloudinaryFace(publicId, size)`,
`characterFace("barnaby"|"sterling"|"victor", size)`,
`titanFace(dayNumber, size)` (returns null for archetype-only days
15-26, 30, 43 — call sites fall back to initials).

Day → publicId map baked into `src/data/titanPhotos.json` (32 photos
covering 35 of 49 days + 3 characters: Sterling `32.Arthur_Sterling_cisvww`,
Barnaby `31.Uncle_Buckley_mlnlal`, Victor `33.Victor_Crane_b4prha`).
Days 14 + 49 also point to Sterling. Refresh:
`cd artifacts/mobile && node scripts/build-titan-photos.cjs`.

### Audio — `src/data/audioMap.ts`

URL pattern (audio served from `video/upload`):
```
https://res.cloudinary.com/<cloud>/video/upload/<publicId>.mp3
```

PublicId conventions (Cloudinary root, 6-char random suffix on each):
- Days 1–50: `BRIEFING_DAY_<N>_<TITLE>_<suffix>` (N **not** zero-padded)
- Barnaby intro: `BARNABY_BUCKLEY_THE_LETTER_FROM_BEYOND_<suffix>`
- Sterling intro: `ARTHUR_STERLING_THE_EXECUTOR_S_WELCOME_<suffix>`
- Crane intro: `VICTOR_KRANE_WELCOME_<suffix>` (intentional KRANE)

`audioMap.ts` reads from `src/data/audioMapResolved.json` — ships with
all 53 publicIds resolved. `AUDIO_STUBS_ACTIVE` auto-evaluates `false`
when JSON is non-empty. Refresh:
`cd artifacts/mobile && node scripts/build-audio-map.cjs`.

`AudioPlayer.tsx` is the reusable expo-av player (gold play/pause +
progress bar + JetBrains Mono timing, auto-unloads, handles 404s,
fires `onComplete()`). Used by:
- `app/day/[id]/briefing.tsx` — gold ♪ "LISTEN TO BRIEFING" toggle;
  gold ✓ once finished (`hasListenedDay(day)`)
- `app/onboarding.tsx` — auto-plays per chapter; "Continue" gated until
  audio completes OR 10s fallback fires; "SKIP" jumps to name slide.

## CharacterAvatar

`src/components/CharacterAvatar.tsx` — canonical component for the three
story characters and onError fallback for any remote portrait.

- **Photo state** — when `photoUri` loads: plain circular crop, no chrome.
- **Initials state** — when `forceInitials`, no `photoUri`, or image
  errors: circular `#E8EBF0` field, charcoal initials in Public Sans
  SemiBold (~36% diameter), 2px UBS Red `#CC0000` ring.

Props: `name`, `size`, optional `photoUri`, optional `forceInitials`.

Used in: `onboarding.tsx` (all 3 chapters), `login.tsx` (Sterling crest),
`SterlingMessage.tsx` (48px memo chip), `day/[id]/titan.tsx` (Days 14 +
49 only — `titanName === "Arthur Sterling"`; other Titan days keep the
rectangular dark-bust frame).

## Discord + Supabase leaderboard (api-server)

### Server

- `src/lib/supabase.ts` — lazy singleton, `SUPABASE_URL` +
  `SUPABASE_SERVICE_KEY` (service-role bypasses RLS, server-side only).
- `src/lib/discord.ts` — discord.js v14 lazy client, posts to
  `#bourse-results` and `#victor-crane` in guild `1499442445195411616`.
- `src/lib/cron.ts` — node-cron `0 8 * * *` `Asia/Dubai` (DST-safe),
  daily Victor taunt at 08:00 GST.
- `src/lib/victorTaunts.ts` — 60+ taunts, deterministic daily rotation
  seeded by date.
- `src/routes/leaderboard.ts`:
  - `GET  /api/leaderboard` (top 50)
  - `POST /api/leaderboard/sync` (debounced player NAV upsert)
  - `POST /api/leaderboard/bourse-result` (per-Bourse → Discord + DB)
  - `POST /api/leaderboard/audio` (idempotent merge of audio progress)
- `src/index.ts` — boots Discord + cron after `app.listen`, probes the
  Supabase table, registers SIGTERM/SIGINT graceful shutdown.

Required secrets (already set): `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_KEY`, `DISCORD_BOT_TOKEN`.

### Mobile

- `src/data/leaderboardApi.ts` — fetch/post helpers, fire-and-forget
  (errors `console.warn` only).
- `app/onboarding.tsx` — name slide (≥2 chars to enable "Begin Day One").
- `app/(tabs)/leaderboard.tsx` — polls every 15s while focused
  (re-entrant fetches gated by `inFlightRef`); always synthesises a
  Victor row at #1 (max real NAV × 1.08, floored at starting balance);
  inline name editor for legacy users; "JOIN THE COMMUNITY" CTA opens
  `EXPO_PUBLIC_DISCORD_INVITE_URL` (default `https://discord.gg/NamQ6VYc`).
- `app/day/[id]/bourse.tsx` — `finalize()` fires `postBourseResult({...})`
  after each closeout (fire-and-forget).
- `src/data/store.tsx` — persists `audioListened: number[]` and
  `introsListened: IntroAudioKey[]`; `markAudioListened(day)` and
  `markIntroListened(who)` POST to `/api/leaderboard/audio`.

### One-time SQL setup (REQUIRED — run in Supabase SQL editor)

All scripts are idempotent. Run in order:

1. `artifacts/api-server/scripts/supabase-leaderboard.sql` — creates
   the `leaderboard` table + RLS deny policies. Until this runs,
   `GET /api/leaderboard` returns 500.
2. `artifacts/api-server/scripts/supabase-audio-tracking.sql` — adds
   `audio_listened int[]`, `intros_listened text[]`, GIN indexes.
3. `artifacts/api-server/scripts/supabase-mandate-unlock.sql` — adds
   `mandate_unlocked boolean NOT NULL DEFAULT false` + partial index.
   Until this runs, paywall routes work but `mandate_unlocked` writes
   silently no-op.

## End-of-Game closeout (`app/end.tsx`)

Reached only after Day 49 closes — Day Hub's "View Mandate Closure"
button `router.replace`s to `/end`. Hard guard: bounces to ledger if
`daysCompleted` does not include 49 (waits for `loaded` to avoid
bouncing during AsyncStorage hydration). `?preview=1` query param
bypasses the guard for canvas/design tooling only.

Layers:
- **Background video** — looping CHF-bills clip at 0.35 opacity via
  `expo-av` (`endgameVideoUrl()` → `Hyperrealistic_commercial_smal_k7d4kf.mp4`)
  with parchment veil for legibility.
- **Brand seal** — `assets/images/aum_logo.png` (required at module-scope
  as `AUM_LOGO`) above gold rule + "MANDATE CLOSED · DAY 49".
- **Certificate card** — gold (#C8A96E) top bar, player name (Cormorant
  serif, falls back "Anonymous Steward"), italic blurb, final AUM via
  `fmtMoney()`, Victor/Day-49 footer. Captured via `react-native-view-shot`
  `captureRef`, shared via `expo-sharing` ("DOWNLOAD CERTIFICATE").
- **THE DESK YOU SERVED** — 3-up credits strip (Sterling/Barnaby/Victor)
  via `characterFace(...)` memoised once per mount; `TrioCard` subcomponent
  with 2-letter gold mark fallback (AS / BB / VC). Portraits are the only
  non-zero `borderRadius` here (deliberate — circular faces). Local
  `assets/images/{barnaby,sterling,victor}.png` files exist as legacy
  fallbacks but **must not** be `require()`'d — Cloudinary is canonical.
- **Top-10 leaderboard** — pulsing red LIVE dot; current player gets 2px
  red left-border; if rank > 10, "YOU — …" row pinned beneath top 10.
- **Closing quote** — Victor block with 2px red left bar.
- **JOIN THE COMMUNITY** — opens `EXPO_PUBLIC_DISCORD_INVITE_URL`.
- Animations: staggered fade+slide (seal 200ms → cert 600ms → buttons
  1100ms → memoriam 1300ms → board 1600ms → quote 2000ms) + LIVE-dot pulse.

## Stripe paywall — The Mandate Unlock

$9.99 USD one-time purchase gates Day 2+. **Day 1 is fully free** (8
stations + $25K bonus). Tapping "Proceed" on the Day 1 hub or
deep-linking `/day/2`+ routes to `app/paywall.tsx`.

**Checkout = static Stripe Payment Link** (not a server-created session).
The paywall opens `EXPO_PUBLIC_STRIPE_PAYMENT_LINK` (public URL, safe
client-side; literal fallback in `paywall.tsx`) with the player's
`userId` appended as `?client_reference_id=…`. Stripe carries that id
onto the Checkout Session so the unlock stays bound to the right player.
The legacy server-created session route (`POST /api/stripe/checkout`)
still exists and works but is no longer called by the client.

**Stripe Dashboard config (REQUIRED for auto-unlock)**: the Payment Link
must be set to redirect after payment to
`https://<deployed-domain>/paywall-success` (Stripe → Payment Links →
this link → After payment → Redirect). Stripe auto-appends
`?session_id=cs_…`; the success screen verifies it and unlocks. Without
this redirect the payment still succeeds but the player lands on
Stripe's default confirmation page and never returns — the mandate then
only unlocks via the webhook backup (needs `STRIPE_WEBHOOK_SECRET`).

**Source of truth**: `leaderboard.mandate_unlocked` in Supabase. Local
`mandateUnlocked: boolean` is a hydrated mirror under
`@aum/mandate_unlocked`. We do NOT use `stripe-replit-sync` (one product,
no Replit Postgres — Supabase is canonical).

### Server (`artifacts/api-server`)

- `src/lib/stripeClient.ts` — `getUncachableStripeClient()` reads the
  `STRIPE_SECRET_KEY` secret directly (live `sk_live_…` keys managed by
  the user in Secrets); `getStripePublishableKey()` reads
  `STRIPE_PUBLISHABLE_KEY`. We do **not** use Replit's native Stripe
  connector/sandbox — the same live keys apply in dev + prod. API version
  pinned `2025-11-17.clover`.
- `src/routes/stripe.ts` (mounted under `/api`):
  - `POST /api/stripe/checkout` — body `{user_id, display_name?,
    return_origin}` → Checkout Session (mode `payment`, inline price_data
    $9.99, metadata `{user_id, display_name,
    product:"AUM_MANDATE_SEASON_1"}` mirrored on PaymentIntent),
    returns `{url, session_id}`.
  - `GET /api/stripe/status?user_id=...` → `{mandate_unlocked: bool}`
    from Supabase. Mobile polls on Day 2+ entry.
  - `GET /api/stripe/session?session_id=...&user_id=...` —
    server-trusted Stripe verify. **Primary unlock path** — also upserts
    `mandate_unlocked: true`. The player id is read from
    `metadata.user_id` (server sessions) OR `client_reference_id`
    (Payment Links). The `user_id` param binds verification to the
    calling player; mismatch returns `paid:false, error:"user_mismatch"`
    and refuses upsert (stops a leaked `cs_…` URL unlocking another
    account). `product` metadata also checked (null-safe for Payment
    Links).
- `src/routes/stripeWebhook.ts` — mounted in `src/app.ts` with
  `express.raw({type:"application/json"})` BEFORE the global
  `express.json()` (signature verify needs exact bytes). Refuses 503
  until `STRIPE_WEBHOOK_SECRET` is set. **Backup only** — covers users
  who close the success tab before the redirect lands.

### Mobile

- `src/data/store.tsx` — `mandateUnlocked` end-to-end (Persisted, KEYS,
  load/persist, signOut reset). `setMandateUnlocked(bool)` flips
  AsyncStorage; `refreshMandateStatus()` reconciles with `/status` —
  definitive server response (true OR false) overrides local; network
  error (`null`) leaves local untouched so paid players play offline.
  Demoting on definitive false closes the devtools-tampering bypass
  (writing `"true"` into AsyncStorage by hand).
- `src/data/leaderboardApi.ts` — `createCheckoutSession`,
  `fetchMandateStatus`, `fetchStripeSession(sessionId, userId)`.
- `app/paywall.tsx` — gold AUM seal, Cormorant 36px headline, USD 9.99
  mono-bold, gold (#C8A96E) CTA, 2px-red Victor quote. POSTs `/checkout`
  with `window.location.origin` then `window.location.assign(url)` on
  web / `Linking.openURL(url)` on native.
- `app/paywall-success.tsx` — reads `?session_id=`, GETs `/session` with
  current `userId`, only `setMandateUnlocked(true)` if
  `result.paid && result.user_id === userId`, then 3s countdown → `/day/2`.
- `app/day/[id]/index.tsx` — for `day >= 2` refreshes server status and
  hard-redirects to `/paywall` if not unlocked (waits for `loaded`).
  Day 1 "Proceed" routes to `/paywall` when locked, label flips to
  "Unlock the Mandate".

### Testing

Credentials come straight from the `STRIPE_SECRET_KEY` /
`STRIPE_PUBLISHABLE_KEY` secrets (live keys), so dev and production both
hit the **live** Stripe account and process real payments. There is no
Replit Stripe sandbox/connector in the loop. (Test card
`4242 4242 4242 4242` only works while the configured keys are test-mode
`sk_test_…`/`pk_test_…`.)

### iOS / Android caveat

Target is **web (Expo Web)**. Native iOS/Android builds need Apple IAP /
Google Play Billing per platform policy — Stripe Checkout for digital
goods isn't allowed in native binaries. Wrap paywall in
`Platform.OS === "web"` guard before publishing native stores.

### Optional: webhook setup

Stripe dashboard → Developers → Webhooks → Add endpoint
`https://<your-replit-domain>/api/stripe/webhook` → event
`checkout.session.completed` → copy signing secret → add to Replit
Secrets as `STRIPE_WEBHOOK_SECRET`. Without this the webhook returns
503 and players still unlock fine via the success-URL round-trip.

## Privacy policy (`app/privacy.tsx`)

Public route at `/privacy` for Huawei AppGallery + Samsung Galaxy Store
submission. White background, AUM brand mark, Cormorant headings,
JetBrains Mono body, gold accent. 11 numbered sections (Who We Are,
Information We Collect, How We Use, Third-Party Services,
Data Sharing, Data Retention, Your Rights, Children, Security, Changes,
Governing Law). Contact: `j.bernard@matinwealth.com`. Governed by UAE
law. Submit the deployed `https://<deployed-domain>/privacy` URL once
published — the dev URL is temporary.

## Notes / known limitations

- `react-native-web-webview` installed as peer of `react-native-youtube-iframe`
  so the YouTube player bundles for web.
- Some Expo version warnings (`expo-asset`, `expo-file-system`,
  `react-native-webview`, `@react-native-community/slider`) are visible
  in CLI startup — non-fatal, runs both web + Expo Go.
- Leaderboard POST endpoints have **no app-layer auth** — any caller
  reaching the Express server can submit rows. Acceptable MVP; revisit
  if abuse appears.
